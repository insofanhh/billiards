<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\DiscountCode;
use App\Models\Service;
use App\Models\ServiceInventory;
use App\Models\TableBilliard;
use App\Models\Transaction;
use App\Models\User;

use App\Scopes\TenantScope;
use App\Events\OrderApproved;
use App\Events\OrderRejected;
use App\Events\OrderEndRequested;
use App\Events\OrderEndApproved;
use App\Events\OrderEndRejected;
use App\Events\OrderServiceAdded;
use App\Events\OrderUpdated;
use App\Events\OrderServiceUpdated;
use App\Events\OrderServiceRemoved;
use App\Events\OrderServiceConfirmed;
use App\Events\TransactionCreated;
use App\Events\TransactionConfirmed;
use App\Services\PriceCalculatorService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    protected PriceCalculatorService $priceCalculator;
    protected \App\Services\IotService $iotService;

    public function __construct(PriceCalculatorService $priceCalculator, \App\Services\IotService $iotService)
    {
        $this->priceCalculator = $priceCalculator;
        $this->iotService = $iotService;
    }

    /**
     * Get list of orders.
     */
    public function index(Request $request)
    {
        $query = Order::with(['table', 'priceRate', 'items.service', 'transactions.user', 'user', 'adminConfirmedBy']);

        if (!$this->isStaff($request)) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $status = (array) $request->input('status');
            $query->whereIn('status', $status);
        }

        if ($request->filled('table_id')) {
            $query->where('table_id', $request->input('table_id'));
        }

        $orders = $query->latest()->get();
        
        return OrderResource::collection($orders);
    }

    /**
     * Create a new order (Open table).
     */
    public function store(Request $request)
    {
        $request->validate([
            'table_code' => 'required|string',
        ]);

        $table = TableBilliard::where('code', $request->table_code)->firstOrFail();
        
        // Check for blocking orders (Active or Pending End)
        $blockingOrder = Order::where('table_id', $table->id)
            ->whereIn('status', ['active', 'pending_end'])
            ->first();

        if ($blockingOrder) {
            // Self-healing: If table is marked as Free ('Trống') but has an active order, it's a ghost order.
            // We should cancel the ghost order to allow the new one.
            if ($table->status === 'Trống') {
                Log::warning("Ghost order detected and auto-cancelled", [
                    'table_id' => $table->id,
                    'ghost_order_id' => $blockingOrder->id,
                    'user_id' => $request->user()->id
                ]);
                
                $blockingOrder->update([
                    'status' => 'cancelled',
                    'notes' => 'Hệ thống tự động hủy do lỗi trạng thái (Ghost Order)',
                    'end_at' => now(), // Mark end time
                ]);
                
                // Proceed to create new order...
            } else {
                return response()->json([
                    'message' => 'Bàn đang được sử dụng', 
                    'debug' => ['blocking_order_id' => $blockingOrder->id, 'status' => $blockingOrder->status]
                ], 400);
            }
        }

        // Check for pending orders (Requests)
        $pendingOrder = Order::where('table_id', $table->id)
            ->where('status', 'pending')
            ->first();

        if ($pendingOrder) {
            // Allow staff to override pending requests (Force Open)
            if ($this->isStaff($request)) {
                $pendingOrder->update(['status' => 'cancelled']);
            } else {
                return response()->json([
                    'message' => 'Bàn đang có yêu cầu mở chờ xử lý',
                    'debug' => ['pending_order_id' => $pendingOrder->id]
                ], 400);
            }
        }
        
        // If we are here, we can open the table.
        // Use Transaction to ensure atomicity
        try {
            return DB::transaction(function () use ($request, $table) {
                $startTime = Carbon::now();
                $priceRate = \App\Models\PriceRate::forTableTypeAtTime($table->table_type_id, $startTime);
                
                if (!$priceRate) {
                     // Throw exception to rollback logic if inside transaction (though here we haven't done anything yet)
                     // But we can just return response. However, we are inside a Closure.
                     // It's cleaner to check this before transaction? 
                     // PriceRate check is read-only. We can leave it here, but throwing exception is better to escape transaction.
                     throw new \Exception('Không tìm thấy bảng giá cho loại bàn này');
                }
        
                $order = Order::create([
                    'order_code' => 'ORD-' . Str::upper(Str::random(8)),
                    'user_id' => $request->user()->id,
                    'customer_name' => null,
                    'table_id' => $table->id,
                    'store_id' => $table->store_id,
                    'price_rate_id' => $priceRate->id,
                    'start_at' => $startTime,
                    'status' => 'active',
                ]);
                
                // Resolve and set customer name
                $customerName = $this->resolveCustomerName($order, $request);
                $order->update(['customer_name' => $customerName]);
        
                if ($table) {
                    $table->update(['status' => 'Đang sử dụng']);
                    
                    try {
                        $this->iotService->turnOnTable($table);
                    } catch (\Exception $e) {
                         // Decide: do we fail the whole order if IoT fails?
                         // "Trống" vs "Đang sử dụng" is DB state. 
                         // If light fails, maybe just Log it? 
                         // If we throw here, transaction rolls back, order deleted, table stays 'Trống'. 
                         // That is probably safer than having an active order on a dark table.
                         // But for now, let's Log and proceed, or the user can't open table if IoT is flaky.
                         Log::error("IoT Turn On Error: " . $e->getMessage());
                    }
                }
        
                return new OrderResource($order->load(['table', 'priceRate']));
            });
            
        } catch (\Exception $e) {
            if ($e->getMessage() === 'Không tìm thấy bảng giá cho loại bàn này') {
                return response()->json([
                    'message' => 'Không tìm thấy bảng giá cho loại bàn này',
                    'debug' => [
                        'table_type_id' => $table->table_type_id,
                    ]
                ], 400);
            }
            throw $e;
        }
    }

    /**
     * Show order details.
     */
    public function show(Request $request, $id)
    {
        $query = Order::where('id', $id)
            ->with(['table', 'priceRate', 'items.service', 'mergedTableFees', 'transactions.user', 'appliedDiscount', 'user', 'adminConfirmedBy']);

        if (!$this->isStaff($request)) {
            $query->where('user_id', $request->user()->id);
        }

        $order = $query->firstOrFail();
        
        return new OrderResource($order);
    }

    /**
     * Add a service item to the order.
     */
    public function addService(Request $request, $id)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'qty' => 'required|integer|min:1',
        ]);

        $query = Order::where('id', $id)->whereIn('status', ['active', 'pending_end']);
        if (!$this->isStaff($request)) {
            $query->where('user_id', $request->user()->id);
        }
        $order = $query->firstOrFail();

        $service = Service::findOrFail($request->service_id);
        
        if (!$service->active) {
            return response()->json(['message' => 'Dịch vụ không còn hoạt động'], 400);
        }

        $qty = (int) $request->qty;

        $orderItem = DB::transaction(function () use ($order, $service, $qty, $request) {
            $this->ensureInventoryAvailable($service, $qty);

            $shouldAutoConfirm = $this->isStaff($request);

            $orderItem = OrderItem::create([
                'order_id' => $order->id,
                'service_id' => $service->id,
                'qty' => $qty,
                'unit_price' => $service->price,
                'total_price' => $service->price * $qty,
                'is_confirmed' => $shouldAutoConfirm,
            ]);

            if ($shouldAutoConfirm) {
                // If auto-confirming, we deduct inventory immediately
                $this->deductInventoryForItem($orderItem);
            }

            return $orderItem;
        });

        $order->refresh();
        $order->load(['table', 'priceRate', 'items.service', 'transactions', 'appliedDiscount']);
        event(new OrderServiceAdded($order));

        // Use 201 Created
        return response()->json(['message' => 'Đã thêm dịch vụ thành công', 'item' => $orderItem], 201);
    }

    /**
     * Update quantity of a service item.
     */
    public function updateService(Request $request, $id, $itemId)
    {
        $request->validate([
            'qty' => 'required|integer|min:1',
        ]);

        $query = Order::where('id', $id)->whereIn('status', ['active', 'pending_end']);
        if (!$this->isStaff($request)) {
            $query->where('user_id', $request->user()->id);
        }
        $order = $query->firstOrFail();

        $orderItem = OrderItem::where('id', $itemId)
            ->where('order_id', $order->id)
            ->firstOrFail();

        // Allow editing confirmed items logic update
        // if ($orderItem->is_confirmed || $orderItem->stock_deducted) {
        //     return response()->json(['message' => 'Không thể chỉnh sửa dịch vụ đã được xác nhận hoặc đã trừ kho'], 400);
        // }

        $newQty = (int) $request->qty;
        $oldQty = $orderItem->qty;
        $diff = $newQty - $oldQty;

        if ($diff === 0) {
             return response()->json(['message' => 'Số lượng không thay đổi', 'item' => $orderItem->load('service')]);
        }

        DB::transaction(function () use ($orderItem, $newQty, $oldQty, $diff) {
            $service = $orderItem->service;

            if ($orderItem->stock_deducted) {
                // Item was already deducted from stock. We need to handle the difference.
                $inventory = ServiceInventory::firstOrCreate(
                    ['service_id' => $service->id],
                    ['quantity' => 0]
                );

                if ($diff > 0) {
                    // Increasing quantity: Check if we have enough FOR THE DIFFERENCE
                    if ($inventory->quantity < $diff) {
                         throw new \Exception("Dịch vụ {$service->name} không đủ số lượng trong kho (cần thêm {$diff})");
                    }
                    $inventory->decrement('quantity', $diff);
                } else {
                    // Decreasing quantity: Return stock
                    $inventory->increment('quantity', abs($diff));
                }
            } else {
                // Stock NOT deducted yet. Just check if we have enough for the NEW TOTAL
                // This will throw if strictly not enough, but won't deduct.
                $this->ensureInventoryAvailable($service, $newQty);
            }

            $orderItem->update([
                'qty' => $newQty,
                'total_price' => $orderItem->unit_price * $newQty,
            ]);
        });

        $order->refresh();
        $order->load(['table', 'priceRate', 'items.service', 'transactions', 'appliedDiscount']);
        event(new OrderServiceUpdated($order));

        return response()->json(['message' => 'Đã cập nhật số lượng dịch vụ', 'item' => $orderItem->load('service')]);
    }

    /**
     * Remove a service item.
     */
    public function removeService(Request $request, $id, $itemId)
    {
        $query = Order::where('id', $id)->whereIn('status', ['active', 'pending_end']);
        if (!$this->isStaff($request)) {
            $query->where('user_id', $request->user()->id);
        }
        $order = $query->firstOrFail();

        $orderItem = OrderItem::where('id', $itemId)
            ->where('order_id', $order->id)
            ->firstOrFail();

        DB::transaction(function () use ($orderItem) {
            if ($orderItem->stock_deducted) {
                // Return stock to inventory
                $inventory = ServiceInventory::firstOrCreate(
                    ['service_id' => $orderItem->service_id],
                    ['quantity' => 0]
                );
                $inventory->increment('quantity', $orderItem->qty);
            }
            $orderItem->delete();
        });

        $order->refresh();
        $order->load(['table', 'priceRate', 'items.service', 'transactions', 'appliedDiscount']);
        event(new OrderServiceRemoved($order));

        return response()->json(['message' => 'Đã xóa dịch vụ khỏi đơn hàng']);
    }

    /**
     * Confirm a service item (Staff only).
     */
    public function confirmServiceItem(Request $request, $id, $itemId)
    {
        if (!$this->isStaff($request)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $order = Order::where('id', $id)->firstOrFail();

        $orderItem = OrderItem::where('id', $itemId)
            ->where('order_id', $order->id)
            ->firstOrFail();

        DB::transaction(function () use ($orderItem) {
            if (!$orderItem->stock_deducted) {
                $this->deductInventoryForItem($orderItem);
            }

            if (!$orderItem->is_confirmed) {
                $orderItem->update(['is_confirmed' => true]);
            }
        });

        $order->refresh();
        $order->load(['table', 'priceRate', 'items.service', 'transactions', 'appliedDiscount']);
        event(new OrderServiceConfirmed($order));

        return response()->json(['message' => 'Đã xác nhận dịch vụ', 'item' => $orderItem->fresh()->load('service')]);
    }

    /**
     * Request to end the order (Client).
     */
    public function requestEnd(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->firstOrFail();

        // Skip approval step: Complete the order immediately
        $this->completeOrderInternal($order, $request);

        return response()->json(['message' => 'Đã kết thúc giờ chơi. Vui lòng thanh toán.'], 200);
    }

    /**
     * Approve order end request (Staff).
     */
    public function approveEnd(Request $request, $id)
    {
        $query = Order::where('id', $id)->whereIn('status', ['active', 'pending_end']);
        
        if (!$this->isStaff($request)) {
            $query->where('user_id', $request->user()->id);
        }
        $order = $query->with(['transactions', 'table', 'priceRate', 'items.service', 'appliedDiscount', 'user'])->firstOrFail();

        $this->completeOrderInternal($order, $request);

        return new OrderResource($order);
    }

    /**
     * Reject order end request (Staff).
     */
    public function rejectEnd(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->where('status', 'pending_end')
            ->firstOrFail();

        $order->update(['status' => 'active']);
        $order->load(['user']);

        event(new OrderEndRejected($order));

        return response()->json(['message' => 'Đã từ chối yêu cầu kết thúc giờ chơi'], 200);
    }

    /**
     * Approve a pending order request (Staff).
     */
    public function approve(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->where('status', 'pending')
            ->firstOrFail();

        $startTime = Carbon::now();
        $priceRate = \App\Models\PriceRate::forTableTypeAtTime($order->table->table_type_id, $startTime);
        
        if (!$priceRate) {
            return response()->json(['message' => 'Không tìm thấy bảng giá cho loại bàn này'], 400);
        }

        $order->update([
            'start_at' => $startTime,
            'price_rate_id' => $priceRate->id,
            'status' => 'active',
            'admin_confirmed_by' => $request->user()->id,
        ]);

        if ($order->table) {
            $order->table->update(['status' => 'Đang sử dụng']);
            $this->iotService->turnOnTable($order->table);
        }

        $order->load(['table', 'priceRate', 'user']);
        event(new OrderApproved($order));

        return new OrderResource($order);
    }

    /**
     * Reject a pending order request (Staff).
     */
    public function reject(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->where('status', 'pending')
            ->firstOrFail();

        $order->update(['status' => 'cancelled']);
        
        event(new OrderRejected($order));

        return response()->json(['message' => 'Đã từ chối yêu cầu'], 200);
    }

    /**
     * Add multiple services to an order.
     */
    public function addServices(Request $request, string $id)
    {
        $order = Order::findOrFail($id);

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.qty' => 'required|integer|min:1',
        ]);

        $shouldAutoConfirm = $this->isStaff($request);
        
        // Use a fixed timestamp for all items in this batch to ensure they group together
        $now = now();

        DB::beginTransaction();
        try {
            foreach ($validated['items'] as $itemData) {
                $service = Service::findOrFail($itemData['service_id']);
                
                // Get inventory
                $inventory = ServiceInventory::firstOrCreate(
                    ['service_id' => $service->id],
                    ['quantity' => 0]
                );
                
                // Check stock availability (Always check to prevent requesting OOS)
                $available = $inventory->quantity; // + existing if any? No, new items.
                if ($available < $itemData['qty']) {
                     throw new \Exception("Dịch vụ {$service->name} không đủ số lượng trong kho (Hiện có: {$available})");
                }

                $stockDeducted = false;

                // Deduct stock if auto-confirming (Staff)
                if ($shouldAutoConfirm) {
                    $inventory->decrement('quantity', $itemData['qty']);
                    $stockDeducted = true;
                }

                OrderItem::create([
                    'order_id' => $order->id,
                    'service_id' => $service->id,
                    'qty' => $itemData['qty'],
                    'unit_price' => $service->price,
                    'total_price' => $service->price * $itemData['qty'],
                    'is_confirmed' => $shouldAutoConfirm,
                    'stock_deducted' => $stockDeducted,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
            
            // Recalculate total
            $total = $order->items()->sum('total_price');
            $order->update(['total_before_discount' => $total]);
            
            DB::commit();

            // Broadcast events...
            $order->load('table');
            if ($shouldAutoConfirm) {
                 broadcast(new OrderUpdated($order));
            } else {
                 broadcast(new OrderServiceAdded($order));
                 broadcast(new OrderUpdated($order));
            }

            return response()->json(['message' => 'Services added successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Cancel an order request (Client).
     */
    public function cancelRequest(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $order->update(['status' => 'cancelled']);
        $order->load(['table', 'priceRate', 'items.service', 'transactions', 'appliedDiscount', 'user']);

        event(new OrderRejected($order));

        return new OrderResource($order);
    }

    /**
     * Apply discount code to the order.
     */
    public function applyDiscount(Request $request, $id)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $query = Order::where('id', $id)->whereIn('status', ['pending_end', 'completed']);
        if (!$this->isStaff($request)) {
            $query->where('user_id', $request->user()->id);
        }

        $order = $query->firstOrFail();
        $totalBefore = (float) $order->total_before_discount;
        
        if ($totalBefore <= 0) {
            return response()->json(['message' => 'Đơn hàng chưa có tổng tiền để áp dụng mã giảm giá'], 422);
        }

        $code = Str::upper(trim($request->input('code')));
        
        // Check for discount code explicitly within the order's store
        $discountCode = DiscountCode::withoutGlobalScopes()
            ->where('store_id', $order->store_id)
            ->whereRaw('LOWER(code) = ?', [Str::lower($code)])
            ->first();
        
        if (!$discountCode) {
            return response()->json(['message' => 'Mã giảm giá không tồn tại'], 404);
        }

        if (!$discountCode->active) {
            return response()->json(['message' => 'Mã giảm giá đã bị vô hiệu hóa'], 422);
        }

        $now = Carbon::now();
        if ($discountCode->start_at && $now->lt($discountCode->start_at)) {
            return response()->json(['message' => 'Mã giảm giá chưa bắt đầu'], 422);
        }
        if ($discountCode->end_at && $now->gt($discountCode->end_at)) {
            return response()->json(['message' => 'Mã giảm giá đã hết hạn'], 422);
        }
        if ($discountCode->usage_limit && $discountCode->used_count >= $discountCode->usage_limit) {
            return response()->json(['message' => 'Mã giảm giá đã đạt giới hạn sử dụng'], 422);
        }

        if ($discountCode->min_spend && $totalBefore < (float) $discountCode->min_spend) {
            return response()->json([
                'message' => 'Đơn hàng chưa đạt giá trị tối thiểu (' . number_format($discountCode->min_spend) . ' đ)',
                'detail' => [
                    'required' => $discountCode->min_spend,
                    'current' => $totalBefore
                ]
            ], 422);
        }

        $discountAmount = 0.0;
        if ($discountCode->discount_type === 'percent') {
            $discountAmount = $totalBefore * ($discountCode->discount_value / 100);
        } elseif ($discountCode->discount_type === 'fixed') {
            $discountAmount = (float) $discountCode->discount_value;
        }

        $discountAmount = min($discountAmount, $totalBefore);
        $roundedDiscount = round($discountAmount);
        $roundedTotalPaid = round(max(0, $totalBefore - $discountAmount));

        DB::transaction(function () use ($order, $discountCode, $roundedDiscount, $roundedTotalPaid, $request) {
            // Revert previous discount usage if changed
            if ($order->applied_discount_id && $order->applied_discount_id !== $discountCode->id) {
                $previous = DiscountCode::find($order->applied_discount_id);
                if ($previous && $previous->used_count > 0) {
                    $previous->decrement('used_count');
                }
            }

            if ($order->applied_discount_id !== $discountCode->id) {
                $discountCode->increment('used_count');
                
                // Determine user safely
                $user = $request->user();
                if ($user) {
                    DB::table('user_saved_discounts')
                        ->where('user_id', $user->id)
                        ->where('discount_code_id', $discountCode->id)
                        ->delete();
                }
            }

            $order->update([
                'applied_discount_id' => $discountCode->id,
                'total_discount' => $roundedDiscount,
                'total_paid' => $roundedTotalPaid,
            ]);
        });

        $order->refresh();
        $order->load(['table', 'priceRate', 'items.service', 'transactions', 'appliedDiscount', 'user']);

        return new OrderResource($order);
    }

    /**
     * Remove applied discount from the order.
     */
    public function removeDiscount(Request $request, $id)
    {
        if (!$this->isStaff($request)) {
             return response()->json(['message' => 'Forbidden'], 403);
        }

        $order = Order::where('id', $id)->whereIn('status', ['pending_end', 'completed'])->firstOrFail();

        if (!$order->applied_discount_id) {
             return response()->json(['message' => 'Đơn hàng không có mã giảm giá nào'], 422);
        }

        DB::transaction(function () use ($order) {
            $discountCode = $order->appliedDiscount;
            if ($discountCode && $discountCode->used_count > 0) {
                $discountCode->decrement('used_count');
            }

            // Also restore user saved discount if applicable?
            // "applyDiscount" deletes from user_saved_discounts.
            // "removeDiscount" should probably not auto-restore it to saved list because we don't know if it was from saved list.
            // But if it was, the user lost it. 
            // However, typical logic: used code is removed from saved. If cancelled, maybe it should be restored?
            // To be safe and simple: just decrement usage count. Re-saving is manual or separate logic.
            // The requirement doesn't specify, so I'll stick to decrement used_count.

            $order->update([
                'applied_discount_id' => null,
                'total_discount' => 0,
                'total_paid' => $order->total_before_discount,
            ]);
        });

        $order->refresh();
        $order->load(['table', 'priceRate', 'items.service', 'transactions', 'appliedDiscount', 'user']);

        return new OrderResource($order);
    }

    /**
     * Create a payment transaction.
     */
    public function createTransaction(Request $request, $id)
    {
        $request->validate([
            'method' => 'required|in:cash,card,mobile',
            'amount' => 'required|numeric|min:0',
        ]);

        $isStaff = $this->isStaff($request);
        $query = Order::where('id', $id)->whereIn('status', ['completed', 'pending_end'])->with(['user']);
        
        if (!$isStaff) {
            $query->where('user_id', $request->user()->id);
        }
        $order = $query->firstOrFail();

        $hasSuccessfulTransaction = Transaction::where('order_id', $order->id)
            ->where('status', 'success')
            ->exists();

        if ($hasSuccessfulTransaction && !$isStaff) {
            return response()->json(['message' => 'Đơn hàng đã được thanh toán. Vui lòng tải lại hóa đơn.'], 422);
        }

        $method = $request->input('method');
        $amount = (float) $request->input('amount');
        $customerName = $this->resolveCustomerName($order, $request);

        // Pending logic
        $shouldPending = !$isStaff && in_array($method, ['cash', 'card', 'mobile'], true);

        $hasPendingTransaction = Transaction::where('order_id', $order->id)
            ->where('status', 'pending')
            ->exists();

        $hasUnconfirmedItems = OrderItem::where('order_id', $order->id)
            ->where('is_confirmed', false)
            ->exists();

        // Staff or mobile transfer can auto-confirm items in some logic, preserving original flow
        $shouldForceConfirmItems = ($isStaff || $method === 'mobile') && $hasUnconfirmedItems;

        if (!$hasPendingTransaction && $hasUnconfirmedItems && !$shouldForceConfirmItems) {
            return response()->json(['message' => 'Vẫn còn dịch vụ chưa xác nhận, vui lòng xác nhận trước khi thanh toán.'], 422);
        }

        if ($hasPendingTransaction && !$shouldPending && $hasUnconfirmedItems && !$shouldForceConfirmItems) {
            return response()->json(['message' => 'Vẫn còn dịch vụ chưa xác nhận, vui lòng xác nhận trước khi thanh toán.'], 422);
        }

        $transaction = DB::transaction(function () use ($request, $order, $shouldPending, $method, $amount, $customerName, $shouldForceConfirmItems) {
            if ($shouldForceConfirmItems) {
                $this->forceConfirmAllItems($order);
            }

            $this->deductInventoryForOrder($order);

            $pendingTransaction = Transaction::where('order_id', $order->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->first();

            $reference = 'TXN-' . Str::upper(Str::random(10));

            if ($pendingTransaction) {
                $updates = [
                    'method' => $method,
                    'amount' => $amount,
                    'user_id' => $request->user()->id,
                ];

                if (!$pendingTransaction->reference) {
                    $updates['reference'] = $reference;
                }

                if ($customerName && !$pendingTransaction->customer_name) {
                    $updates['customer_name'] = $customerName;
                }

                if ($shouldPending) {
                    $pendingTransaction->update($updates);
                } else {
                    $pendingTransaction->update(array_merge($updates, ['status' => 'success']));
                    $this->markOrderAsPaid($order, $amount);
                }

                return $pendingTransaction->fresh();
            }

            // Create new transaction
            $transaction = Transaction::create([
                'order_id' => $order->id,
                'store_id' => $order->store_id,
                'user_id' => $request->user()->id,
                'customer_name' => $customerName,
                'amount' => $amount,
                'method' => $method,
                'status' => $shouldPending ? 'pending' : 'success',
                'reference' => $reference,
            ]);

            if (!$shouldPending) {
                $this->markOrderAsPaid($order, $amount);
            }

            return $transaction;
        });

        $transaction->load(['order.table', 'order.user', 'user']);
        event(new TransactionCreated($transaction));
        
        if (!$shouldPending) {
            event(new TransactionConfirmed($transaction));
        }

        return response()->json([
            'message' => $shouldPending ? 'Yêu cầu thanh toán đã được gửi, vui lòng chờ nhân viên xác nhận' : 'Thanh toán thành công',
            'transaction' => $transaction,
        ], 201);
    }

    /**
     * Confirm a pending transaction (Staff only).
     */
    public function confirmTransaction(Request $request, $id, $txnId)
    {
        if (!$this->isStaff($request)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $order = Order::where('id', $id)->firstOrFail();
        $transaction = Transaction::where('id', $txnId)
            ->where('order_id', $order->id)
            ->where('status', 'pending')
            ->firstOrFail();

        if (!$transaction->method) {
            return response()->json(['message' => 'Khách hàng chưa chọn phương thức thanh toán.'], 422);
        }

        DB::transaction(function () use ($transaction, $order, $request) {
            $pendingItems = OrderItem::where('order_id', $order->id)
                ->where('is_confirmed', false)
                ->lockForUpdate()
                ->get();

            foreach ($pendingItems as $item) {
                $item->update(['is_confirmed' => true]);
            }

            $this->deductInventoryForOrder($order);

            $transaction->update([
                'status' => 'success',
                'user_id' => $request->user()->id,
            ]);

            $this->markOrderAsPaid($order, $transaction->amount);
        });

        $transaction->load(['order.user', 'user']);
        event(new TransactionConfirmed($transaction));

        return response()->json([
            'message' => 'Đã xác nhận thanh toán',
            'transaction' => $transaction->fresh(['user']),
        ], 200);
    }

    // --- Private Helper Methods ---

    /**
     * Internal simplified logic to complete an order.
     */
    private function completeOrderInternal(Order $order, Request $request)
    {
        $transaction = null;
        $customerName = $this->resolveCustomerName($order, $request);

        DB::transaction(function () use (&$order, &$transaction, $request, $customerName) {
            $order->update([
                'end_at' => Carbon::now(),
                'status' => 'completed',
            ]);

            $startTime = $order->start_at instanceof Carbon ? $order->start_at : Carbon::parse($order->start_at);
            $endTime = $order->end_at instanceof Carbon ? $order->end_at : Carbon::parse($order->end_at);
            
            $playTimeMinutes = $startTime->diffInMinutes($endTime);
            
            // Calculate table cost using the injected Service
            $tableCost = $this->priceCalculator->calculateTableCost($order, $startTime, $endTime);
            
            $servicesCost = $order->items->sum('total_price');
            $mergedFeesCost = $order->mergedTableFees()->sum('total_price');
            
            $totalBeforeDiscount = $tableCost + $servicesCost + $mergedFeesCost;

            $discount = 0;
            if ($order->applied_discount_id) {
                $discountCode = $order->appliedDiscount;
                if ($discountCode && $discountCode->discount_type === 'percent') {
                    $discount = $totalBeforeDiscount * ($discountCode->discount_value / 100);
                } elseif ($discountCode && $discountCode->discount_type === 'fixed') {
                    $discount = $discountCode->discount_value;
                }
            }

            $totalPaid = $totalBeforeDiscount - $discount;

            $updateData = [
                'total_play_time_minutes' => $playTimeMinutes,
                'total_before_discount' => round($totalBeforeDiscount),
                'total_discount' => round($discount),
                'total_paid' => round($totalPaid),
            ];
            
            // Ensure customer_name is set if not already
            if (!$order->customer_name) {
                $updateData['customer_name'] = $customerName;
            }
            
            $order->update($updateData);

            if ($order->table) {
                $this->iotService->turnOffTable($order->table);
            }

            // Handle pending transaction creation or update
            $existingPending = Transaction::where('order_id', $order->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->first();

            if (!$existingPending) {
                $transaction = Transaction::create([
                    'order_id' => $order->id,
                    'store_id' => $order->store_id,
                    'user_id' => $request->user()->id,
                    'customer_name' => $customerName,
                    'amount' => $order->total_paid,
                    'method' => null,
                    'status' => 'pending',
                    'reference' => 'TXN-' . Str::upper(Str::random(10)),
                ]);
            } else {
                if ($customerName && !$existingPending->customer_name) {
                    $existingPending->update(['customer_name' => $customerName]);
                }
                $transaction = $existingPending;
            }
        });

        $order->load(['table', 'priceRate', 'items.service', 'appliedDiscount', 'user', 'transactions']);

        if ($transaction) {
            $transaction->load(['order.table', 'order.user']);
            event(new TransactionCreated($transaction));
        }

        event(new OrderEndApproved($order));
    }



    private function markOrderAsPaid(Order $order, float $paidAmount)
    {
        $order->update([
            'total_paid' => max((float) $order->total_paid, $paidAmount),
            'status' => 'completed',
        ]);
        
        if ($order->table) {
            $order->table->update(['status' => 'Trống']);
        }
    }

    /**
     * Check if user is staff/admin/super_admin.
     */
    private function isStaff(Request $request): bool
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }
        
        if (!$user->relationLoaded('roles')) {
            $user->load('roles');
        }
        
        // Use case-insensitive check
        $roles = $user->roles->pluck('name')
            ->map(fn($role) => strtolower($role))
            ->toArray();
            
        if (array_intersect(['staff', 'admin', 'super_admin', 'super admin', 'manager', 'owner'], $roles)) {
            return true;
        }
        
        try {
            if (method_exists($user, 'hasAnyRole')) {
                // Also try case-insensitive checks if possible, but hasAnyRole is usually strict.
                // We'll rely on our manual check above for robustness.
                if ($user->hasAnyRole(['admin', 'staff', 'super_admin', 'Super Admin', 'Staff', 'Admin'])) {
                    return true;
                }
            }
        } catch (\Throwable $e) {
            if (config('app.debug')) {
                Log::warning('isStaff role check error', [
                    'error' => $e->getMessage(),
                    'user_id' => $user->id
                ]);
            }
        }
        
        return false;
    }

    private function resolveCustomerName(Order $order, Request $request): ?string
    {
        $orderUser = $order->user;
        if (!$orderUser || $this->userHasStaffRole($orderUser)) {
            return 'Khách lẻ';
        }
        return $orderUser->name;
    }

    private function userHasStaffRole(?User $user): bool
    {
        if (!$user) {
            return false;
        }
        if (!$user->relationLoaded('roles')) {
            $user->load('roles');
        }
        $roles = $user->roles?->pluck('name')->map(fn ($role) => strtolower($role))->toArray() ?? [];
        return !empty(array_intersect(['staff', 'admin', 'super_admin'], $roles));
    }

    private function ensureInventoryAvailable(Service $service, int $qty, ?OrderItem $existingItem = null): void
    {
        if ($qty <= 0) {
            throw ValidationException::withMessages(['qty' => 'Số lượng phải lớn hơn 0']);
        }

        $inventory = ServiceInventory::firstOrCreate(
            ['service_id' => $service->id],
            ['quantity' => 0]
        );

        $available = $inventory->quantity + ($existingItem?->qty ?? 0);

        if ($qty > $available) {
            throw ValidationException::withMessages([
                'qty' => "Kho của {$service->name} không đủ, hiện có {$inventory->quantity}",
            ]);
        }
    }

    private function deductInventoryForOrder(Order $order): void
    {
        $items = OrderItem::where('order_id', $order->id)
            ->whereNotNull('service_id') // Skip custom items (fees)
            ->where('is_confirmed', true)
            ->where('stock_deducted', false)
            ->with('service')
            ->lockForUpdate()
            ->get();

        foreach ($items as $item) {
            $this->deductInventoryForItem($item);
        }
    }

    private function forceConfirmAllItems(Order $order): void
    {
        OrderItem::where('order_id', $order->id)
            ->where('is_confirmed', false)
            ->update(['is_confirmed' => true]);
    }

    private function deductInventoryForItem(OrderItem $item): void
    {
        if (!$item->service_id) {
            return;
        }

        $inventory = ServiceInventory::firstOrCreate(
            ['service_id' => $item->service_id],
            ['quantity' => 0]
        );

        if ($inventory->quantity < $item->qty) {
            throw ValidationException::withMessages([
                'inventory' => "Kho của {$item->service->name} không đủ để trừ",
            ]);
        }

        $inventory->decrement('quantity', $item->qty);
        $item->update([
            'stock_deducted' => true,
            'is_confirmed' => true,
        ]);
    }
    /**
     * Merge or Move table.
     */
    public function mergeTables(Request $request)
    {
        $request->validate([
            'source_table_id' => 'required|exists:tables_billiards,id',
            'target_table_id' => 'required|exists:tables_billiards,id|different:source_table_id',
        ]);

        $sourceTableId = $request->input('source_table_id');
        $targetTableId = $request->input('target_table_id');

        // Get Active Order for Source
        $orderA = Order::where('table_id', $sourceTableId)
            ->where('status', 'active')
            ->first();

        if (!$orderA) {
            return response()->json(['message' => 'Bàn nguồn không còn hoạt động'], 400);
        }

        // Get Active Order for Target
        $orderB = Order::where('table_id', $targetTableId)
            ->where('status', 'active')
            ->first();

        $targetTable = TableBilliard::find($targetTableId);
        
        // Scenario 1: Target is Empty -> Move Table
        if (!$orderB) {
            if ($targetTable->status !== 'Trống') {
                 // Even if no active order, if status is not 'Trống' (e.g. Broken, or dirty state?), we might block?
                 // Checking if another user just opened it?
                 // Let's assume if no active order, we can forcefully take it if it's meant to be empty.
            }

            DB::transaction(function () use ($orderA, $targetTable, $sourceTableId) {
                $oldTable = TableBilliard::find($sourceTableId);
                
                // 1. Update Order's Table ID
                $orderA->update(['table_id' => $targetTable->id]);

                // 2. Update Price Rate if Table Type is different
                if ($oldTable->table_type_id !== $targetTable->table_type_id) {
                     $newPriceRate = \App\Models\PriceRate::forTableTypeAtTime(
                         $targetTable->table_type_id, 
                         Carbon::parse($orderA->start_at)
                     );
                     if ($newPriceRate) {
                         $orderA->update(['price_rate_id' => $newPriceRate->id]);
                     }
                }

                // 3. Update Table Statuses
                $oldTable->update(['status' => 'Trống']);
                $targetTable->update(['status' => 'Đang sử dụng']);

                // 4. IoT Switch
                try {
                    $this->iotService->turnOffTable($oldTable);
                    $this->iotService->turnOnTable($targetTable);
                } catch (\Exception $e) {
                    Log::error("IoT Error during table move: " . $e->getMessage());
                }

                // Broadcast move event
                broadcast(new \App\Events\OrderMoved($orderA->id, $targetTable->name));
            });

            return response()->json(['message' => 'Đã chuyển bàn thành công', 'target_order_id' => $orderA->id]);
        }

        // Scenario 2: Target is Active -> Merge Table
        DB::transaction(function () use ($orderA, $orderB) {
            // 1. Calculate Cost of A
            $startA = Carbon::parse($orderA->start_at);
            $now = Carbon::now();
            
            // Calculate Duration String
            $diff = $startA->diff($now);
            $durationStr = $diff->h . 'h ' . $diff->i . 'p';

            $costA = $this->priceCalculator->calculateTableCost($orderA, $startA, $now);
            
            // 2. Add as Fee to Order B
            \App\Models\MergedTableFee::create([
                'store_id' => $orderB->store_id,
                'order_id' => $orderB->id,
                'table_name' => $orderA->table->name ?? $orderA->table->code ?? 'Unknown',
                'start_at' => $startA,
                'end_at' => $now,
                'total_price' => $costA,
            ]);

            // 2.5 Move existing Merged Fees from Order A to Order B (for recursive merges)
            \App\Models\MergedTableFee::where('order_id', $orderA->id)->update(['order_id' => $orderB->id]);

            // Update Order B total (Current Fee + Order A's accumulated total of items/fees)
            $orderB->increment('total_before_discount', $costA + $orderA->total_before_discount);

            // 3. Move Order Items (Services)
            OrderItem::where('order_id', $orderA->id)->update(['order_id' => $orderB->id]);

            // 4. Move Transactions
            Transaction::where('order_id', $orderA->id)->update(['order_id' => $orderB->id]);

            // 5. Delete Order A
            
            // Broadcast merge event to user of Order A before deletion
            broadcast(new \App\Events\OrderMerged($orderA->id, $orderA->user_id, $orderB->table->name ?? 'Mới'));

            $orderA->delete();

            // 6. Reset Table A
            if ($orderA->table) {
                $orderA->table->update(['status' => 'Trống']);
                try {
                    $this->iotService->turnOffTable($orderA->table);
                } catch (\Exception $e) {
                    Log::error("IoT Error during table merge: " . $e->getMessage());
                }
            }
        });

        // Trigger updates
        $orderB->refresh();
        broadcast(new OrderUpdated($orderB));

        return response()->json(['message' => 'Gộp bàn thành công', 'target_order_id' => $orderB->id]);
    }
}
