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
use App\Events\OrderApproved;
use App\Events\OrderRejected;
use App\Events\OrderEndRequested;
use App\Events\OrderEndApproved;
use App\Events\OrderEndRejected;
use App\Events\OrderServiceAdded;
use App\Events\OrderServiceUpdated;
use App\Events\OrderServiceRemoved;
use App\Events\OrderServiceConfirmed;
use App\Events\TransactionCreated;
use App\Events\TransactionConfirmed;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['table', 'priceRate', 'items.service', 'transactions', 'user']);

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

    public function store(Request $request)
    {
        $request->validate([
            'table_code' => 'required|string',
        ]);

        $table = TableBilliard::where('code', $request->table_code)->firstOrFail();
        
        if ($table->status_id !== 1) {
            return response()->json(['message' => 'Bàn đã được sử dụng'], 400);
        }

        $startTime = Carbon::now();
        $priceRate = \App\Models\PriceRate::forTableTypeAtTime($table->table_type_id, $startTime);
        if (!$priceRate) {
            return response()->json(['message' => 'Không tìm thấy bảng giá cho loại bàn này'], 400);
        }

        $order = Order::create([
            'order_code' => 'ORD-' . Str::upper(Str::random(8)),
            'user_id' => $request->user()->id,
            'table_id' => $table->id,
            'price_rate_id' => $priceRate->id,
            'start_at' => $startTime,
            'status' => 'active',
        ]);

        $table->update(['status_id' => 2]);

        return new OrderResource($order->load(['table', 'priceRate']));
    }

    public function show(Request $request, $id)
    {
        $query = Order::where('id', $id)
            ->with(['table', 'priceRate', 'items.service', 'transactions', 'appliedDiscount', 'user']);

        if (!$this->isStaff($request)) {
            $query->where('user_id', $request->user()->id);
        }

        $order = $query->firstOrFail();
        
        return new OrderResource($order);
    }

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

        $orderItem = DB::transaction(function () use ($order, $service, $qty) {
            $this->ensureInventoryAvailable($service, $qty);

            return OrderItem::create([
            'order_id' => $order->id,
            'service_id' => $service->id,
                'qty' => $qty,
            'unit_price' => $service->price,
                'total_price' => $service->price * $qty,
            'is_confirmed' => false,
        ]);
        });

        $order->refresh();
        $order->load(['table', 'priceRate', 'items.service', 'transactions', 'appliedDiscount']);
        event(new OrderServiceAdded($order));

        return response()->json(['message' => 'Đã thêm dịch vụ thành công', 'item' => $orderItem], 201);
    }

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

        if ($orderItem->is_confirmed || $orderItem->stock_deducted) {
            return response()->json(['message' => 'Không thể chỉnh sửa dịch vụ đã được xác nhận hoặc đã trừ kho'], 400);
        }

        $qty = (int) $request->qty;

        DB::transaction(function () use ($orderItem, $qty) {
            $this->ensureInventoryAvailable($orderItem->service, $qty, $orderItem);

        $orderItem->update([
                'qty' => $qty,
                'total_price' => $orderItem->unit_price * $qty,
        ]);
        });

        $order->refresh();
        $order->load(['table', 'priceRate', 'items.service', 'transactions', 'appliedDiscount']);
        event(new OrderServiceUpdated($order));

        return response()->json(['message' => 'Đã cập nhật số lượng dịch vụ', 'item' => $orderItem->load('service')]);
    }

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

        if ($orderItem->is_confirmed || $orderItem->stock_deducted) {
            return response()->json(['message' => 'Không thể xóa dịch vụ đã được xác nhận hoặc đã trừ kho'], 400);
        }

        $orderItem->delete();

        $order->refresh();
        $order->load(['table', 'priceRate', 'items.service', 'transactions', 'appliedDiscount']);
        event(new OrderServiceRemoved($order));

        return response()->json(['message' => 'Đã xóa dịch vụ khỏi đơn hàng']);
    }

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

    public function requestEnd(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->firstOrFail();

        $order->update(['status' => 'pending_end']);
        $order->load(['table', 'user']);

        event(new OrderEndRequested($order));

        return response()->json(['message' => 'Yêu cầu kết thúc giờ chơi đã được gửi'], 200);
    }

    public function approveEnd(Request $request, $id)
    {
        $query = Order::where('id', $id)
            ->whereIn('status', ['active', 'pending_end']);
        if (!$this->isStaff($request)) {
            $query->where('user_id', $request->user()->id);
        }
        $order = $query->with(['transactions', 'table', 'priceRate', 'items.service', 'appliedDiscount', 'user'])->firstOrFail();

        $transaction = null;
        $customerName = $this->resolveCustomerName($order, $request);

        DB::transaction(function () use (&$order, &$transaction, $request, $customerName) {
            $order->update([
                'end_at' => Carbon::now('Asia/Ho_Chi_Minh'),
                'status' => 'completed',
            ]);

            $startTime = $order->start_at instanceof Carbon ? $order->start_at : Carbon::parse($order->start_at);
            $endTime = $order->end_at instanceof Carbon ? $order->end_at : Carbon::parse($order->end_at);
            
            $playTimeMinutes = $startTime->diffInMinutes($endTime);
            
            $hourlyPrice = (float) $order->priceRate->price_per_hour;
            $perMinutePrice = $hourlyPrice / 60.0;
            $tableCost = $playTimeMinutes * $perMinutePrice;
            
            $servicesCost = $order->items->sum('total_price');
            $totalBeforeDiscount = $tableCost + $servicesCost;

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

            $order->update([
                'total_play_time_minutes' => $playTimeMinutes,
                'total_before_discount' => round($totalBeforeDiscount),
                'total_discount' => round($discount),
                'total_paid' => round($totalPaid),
            ]);

            $existingPending = Transaction::where('order_id', $order->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->first();

            if (!$existingPending) {
                $transaction = Transaction::create([
                    'order_id' => $order->id,
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

        return new OrderResource($order);
    }

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
        $discountCode = DiscountCode::whereRaw('LOWER(code) = ?', [Str::lower($code)])->first();
        if (!$discountCode) {
            return response()->json(['message' => 'Mã giảm giá không tồn tại'], 404);
        }

        if (!$discountCode->active) {
            return response()->json(['message' => 'Mã giảm giá đã bị vô hiệu hóa'], 422);
        }

        $now = Carbon::now('Asia/Ho_Chi_Minh');
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
            return response()->json(['message' => 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã'], 422);
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
            if ($order->applied_discount_id && $order->applied_discount_id !== $discountCode->id) {
                $previous = DiscountCode::find($order->applied_discount_id);
                if ($previous && $previous->used_count > 0) {
                    $previous->decrement('used_count');
                }
            }

            if ($order->applied_discount_id !== $discountCode->id) {
                $discountCode->increment('used_count');
                
                // Xóa voucher khỏi ví của user khi đã sử dụng
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

    public function approve(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->where('status', 'pending')
            ->firstOrFail();

        $startTime = Carbon::now('Asia/Ho_Chi_Minh');
        $priceRate = \App\Models\PriceRate::forTableTypeAtTime($order->table->table_type_id, $startTime);
        if (!$priceRate) {
            return response()->json(['message' => 'Không tìm thấy bảng giá cho loại bàn này'], 400);
        }

        $order->update([
            'start_at' => $startTime,
            'price_rate_id' => $priceRate->id,
            'status' => 'active',
        ]);

        if ($order->table) {
            $order->table->update(['status_id' => 2]);
        }

        $order->load(['table', 'priceRate', 'user']);
        event(new OrderApproved($order));

        return new OrderResource($order);
    }

    public function reject(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->where('status', 'pending')
            ->firstOrFail();

        $order->update(['status' => 'cancelled']);
        $order->load(['user']);

        event(new OrderRejected($order));

        return response()->json(['message' => 'Đã hủy yêu cầu'], 200);
    }

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

    public function createTransaction(Request $request, $id)
    {
        $request->validate([
            'method' => 'required|in:cash,card,mobile',
            'amount' => 'required|numeric|min:0',
        ]);

        $query = Order::where('id', $id)->whereIn('status', ['completed', 'pending_end'])->with(['user']);
        if (!$this->isStaff($request)) {
            $query->where('user_id', $request->user()->id);
        }
        $order = $query->firstOrFail();

        $method = $request->input('method');
        $amount = (float) $request->input('amount');
        $customerName = $this->resolveCustomerName($order, $request);

        // Nếu khách tạo yêu cầu thanh toán tiền mặt/thẻ -> tạo giao dịch PENDING để nhân viên xác nhận.
        $shouldPending = !$this->isStaff($request) && in_array($method, ['cash', 'card'], true);

        $hasPendingTransaction = Transaction::where('order_id', $order->id)
            ->where('status', 'pending')
            ->exists();

        $hasUnconfirmedItems = OrderItem::where('order_id', $order->id)
            ->where('is_confirmed', false)
            ->exists();

        if (!$hasPendingTransaction && $hasUnconfirmedItems) {
            return response()->json(['message' => 'Vẫn còn dịch vụ chưa xác nhận, vui lòng xác nhận trước khi thanh toán.'], 422);
        }

        if ($hasPendingTransaction && !$shouldPending && $hasUnconfirmedItems) {
            return response()->json(['message' => 'Vẫn còn dịch vụ chưa xác nhận, vui lòng xác nhận trước khi thanh toán.'], 422);
        }

        $transaction = DB::transaction(function () use ($request, $order, $shouldPending, $method, $amount, $customerName) {
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
                    if ((float) $order->total_paid === 0.0) {
                        $order->update(['total_paid' => $amount]);
                    }
                    if ($order->table) {
                        $order->table->update(['status_id' => 1]);
                    }
                }

                return $pendingTransaction->fresh();
            }

            $transaction = Transaction::create([
                'order_id' => $order->id,
                'user_id' => $request->user()->id,
                'customer_name' => $customerName,
                'amount' => $amount,
                'method' => $method,
                'status' => $shouldPending ? 'pending' : 'success',
                'reference' => $reference,
            ]);

            if (!$shouldPending) {
                if ((float) $order->total_paid === 0.0) {
                    $order->update(['total_paid' => $amount]);
                }
                if ($order->table) {
                    $order->table->update(['status_id' => 1]);
                }
            }

            return $transaction;
        });

        $transaction->load(['order.table', 'order.user']);
        event(new TransactionCreated($transaction));

        return response()->json([
            'message' => $shouldPending ? 'Yêu cầu thanh toán đã được gửi, vui lòng chờ nhân viên xác nhận' : 'Thanh toán thành công',
            'transaction' => $transaction,
        ], 201);
    }

    public function confirmTransaction(Request $request, $id, $txnId)
    {
        // Chỉ nhân viên được xác nhận
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

            if ((float) $order->total_paid === 0.0) {
                $order->update(['total_paid' => $transaction->amount]);
            }

            if ($order->table) {
                $order->table->update(['status_id' => 1]);
            }
        });

        $transaction->load(['order.user', 'user']);
        event(new TransactionConfirmed($transaction));

        return response()->json([
            'message' => 'Đã xác nhận thanh toán',
            'transaction' => $transaction->fresh(['user']),
        ], 200);
    }

    private function isStaff(Request $request): bool
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }
        
        if (!$user->relationLoaded('roles')) {
            $user->load('roles');
        }
        
        $roles = $user->roles->pluck('name')->toArray();
        if (in_array('staff', $roles) || in_array('admin', $roles) || in_array('super_admin', $roles)) {
            return true;
        }
        
        try {
            if (method_exists($user, 'hasAnyRole')) {
                if ($user->hasAnyRole(['admin', 'staff', 'super_admin'])) {
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
        $order->loadMissing('user');
        $orderUser = $order->user;
        if (!$orderUser) {
            return null;
        }

        $requestUser = $request->user();
        if ($requestUser && $this->isStaff($request) && $orderUser->id === $requestUser->id) {
            return null;
        }

        return $orderUser->name;
    }

    private function ensureInventoryAvailable(Service $service, int $qty, ?OrderItem $existingItem = null): void
    {
        if ($qty <= 0) {
            throw ValidationException::withMessages([
                'qty' => 'Số lượng phải lớn hơn 0',
            ]);
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
            ->where('is_confirmed', true)
            ->where('stock_deducted', false)
            ->with('service')
            ->lockForUpdate()
            ->get();

        foreach ($items as $item) {
            $this->deductInventoryForItem($item);
        }
    }

    private function deductInventoryForItem(OrderItem $item): void
    {
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
}
