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
        
        // Check for blocking orders (Active or Pending End)
        $blockingOrder = Order::where('table_id', $table->id)
            ->whereIn('status', ['active', 'pending_end'])
            ->first();

        if ($blockingOrder) {
            return response()->json([
                'message' => 'Bàn đang được sử dụng', 
                'debug' => ['blocking_order_id' => $blockingOrder->id, 'status' => $blockingOrder->status]
            ], 400);
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
        // We ignore table->status_id check because we validated against actual Orders.


        $startTime = Carbon::now('Asia/Ho_Chi_Minh');
        $priceRate = \App\Models\PriceRate::forTableTypeAtTime($table->table_type_id, $startTime);
        if (!$priceRate) {
            return response()->json([
                'message' => 'Không tìm thấy bảng giá cho loại bàn này',
                'debug' => [
                    'table_type_id' => $table->table_type_id,
                    'time_checked' => $startTime->toDateTimeString(),
                    'timezone' => $startTime->timezoneName,
                    'day_of_week' => $startTime->dayOfWeek
                ]
            ], 400);
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
                // If auto-confirming, we should also deduct inventory immediately to be consistent
                // or just mark as confirmed. 
                // The `confirmServiceItem` logic does: deduct + set confirmed.
                // So let's call deductInventoryForItem here.
                
                // Note: deductInventoryForItem updates the item, so we pass the item instance.
                $this->deductInventoryForItem($orderItem);
            }

            return $orderItem;
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

        // Remove the restriction on confirmed/stock-deducted items
        // if ($orderItem->is_confirmed || $orderItem->stock_deducted) {
        //     return response()->json(['message' => 'Không thể xóa dịch vụ đã được xác nhận hoặc đã trừ kho'], 400);
        // }

        DB::transaction(function () use ($orderItem) {
            if ($orderItem->stock_deducted) {
                // Hoàn trả lại kho
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

        // Skip approval step: Complete the order immediately
        $this->completeOrderInternal($order, $request);

        return response()->json(['message' => 'Đã kết thúc giờ chơi. Vui lòng thanh toán.'], 200);
    }

    public function approveEnd(Request $request, $id)
    {
        $query = Order::where('id', $id)
            ->whereIn('status', ['active', 'pending_end']);
        if (!$this->isStaff($request)) {
            $query->where('user_id', $request->user()->id);
        }
        $order = $query->with(['transactions', 'table', 'priceRate', 'items.service', 'appliedDiscount', 'user'])->firstOrFail();

        $this->completeOrderInternal($order, $request);

        return new OrderResource($order);
    }

    private function completeOrderInternal(Order $order, Request $request)
    {
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
            
            // Calculate table cost based on time segments
            $tableCost = $this->calculateTableCost($order, $startTime, $endTime);
            
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
    }

    private function calculateTableCost(Order $order, Carbon $startTime, Carbon $endTime): float
    {
        $rates = \App\Models\PriceRate::where('table_type_id', $order->table->table_type_id)
            ->active()
            ->orderBy('priority', 'desc')
            ->orderBy('id', 'asc')
            ->get();

        $totalCost = 0.0;
        $current = $startTime->copy();
        
        // Loop through each minute
        while ($current->lt($endTime)) {
            $matchedRate = null;
            $dayOfWeek = $current->dayOfWeek;
            $timeStr = $current->format('H:i:s');
            $prevDayOfWeek = ($dayOfWeek - 1 + 7) % 7;

            foreach ($rates as $rate) {
                // Check 1: Valid for current day?
                $isDayValid = $rate->day_of_week === null || in_array((string)$dayOfWeek, $rate->day_of_week);
                
                if ($isDayValid) {
                    if ($rate->start_time === null && $rate->end_time === null) {
                        $matchedRate = $rate;
                        break;
                    }

                    $start = $rate->start_time;
                    $end = $rate->end_time;

                    if ($start <= $end) {
                        // Standard range
                        if ($timeStr >= $start && $timeStr <= $end) {
                            $matchedRate = $rate;
                            break;
                        }
                    } else {
                        // Overnight range (e.g. 18:00 - 06:00)
                        // On current day, valid if time >= start OR time <= end
                        // BUT if time <= end, it effectively belongs to "yesterday's" shift logically, 
                        // but physically it's today.
                        // If we are strictly checking "started today", then time >= start.
                        // If we are checking "started yesterday", that's the next check.
                        // However, if the rate is configured for "Monday", it usually means "Monday 18:00 to Tuesday 06:00".
                        // So on Monday 05:00, it should match Monday's rate? No, Monday 05:00 is Monday morning.
                        // Monday 18:00-06:00 means:
                        // - Monday 18:00 to 23:59
                        // - Tuesday 00:00 to 06:00 (which is covered by "Previous Day Match")
                        
                        // So here (Current Day Match), we only care if time >= start
                        if ($timeStr >= $start) {
                            $matchedRate = $rate;
                            break;
                        }
                    }
                }

                // Check 2: Valid as extension of previous day? (Overnight)
                $isPrevDayValid = $rate->day_of_week === null || in_array((string)$prevDayOfWeek, $rate->day_of_week);
                
                if ($isPrevDayValid && $rate->start_time !== null && $rate->end_time !== null) {
                    $start = $rate->start_time;
                    $end = $rate->end_time;

                    if ($start > $end) {
                        // It is an overnight rate
                        // If it started yesterday, it is valid today if time <= end
                        if ($timeStr <= $end) {
                            $matchedRate = $rate;
                            break;
                        }
                    }
                }
            }

            // If no rate found, fallback to the order's initial rate or 0
            $rateToUse = $matchedRate ? $matchedRate->price_per_hour : ($order->priceRate ? $order->priceRate->price_per_hour : 0);
            
            $totalCost += $rateToUse / 60.0;
            
            $current->addMinute();
        }

        return $totalCost;
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
            'admin_confirmed_by' => $request->user()->id,
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

        $isStaff = $this->isStaff($request);
        $query = Order::where('id', $id)
            ->whereIn('status', ['completed', 'pending_end'])
            ->with(['user']);
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

        // Nếu khách tạo yêu cầu thanh toán tiền mặt/thẻ -> tạo giao dịch PENDING để nhân viên xác nhận.
        // Nếu khách chọn mobile (chuyển khoản) -> tạo giao dịch PENDING để webhook SePay tự động xác nhận.
        $shouldPending = !$isStaff && in_array($method, ['cash', 'card', 'mobile'], true);

        $hasPendingTransaction = Transaction::where('order_id', $order->id)
            ->where('status', 'pending')
            ->exists();

        $hasUnconfirmedItems = OrderItem::where('order_id', $order->id)
            ->where('is_confirmed', false)
            ->exists();

        // Staff hoặc client chọn mobile (chuyển khoản) thì tự động confirm items
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
                    $order->update([
                        'total_paid' => max((float) $order->total_paid, $amount),
                        'status' => 'completed',
                    ]);
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
                $order->update([
                    'total_paid' => max((float) $order->total_paid, $amount),
                    'status' => 'completed',
                ]);
                if ($order->table) {
                    $order->table->update(['status_id' => 1]);
                }
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

            $order->update([
                'total_paid' => max((float) $order->total_paid, $transaction->amount),
                'status' => 'completed',
            ]);

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
        $order->loadMissing('user.roles');
        $orderUser = $order->user;

        if (!$orderUser) {
            return 'Khách lẻ';
        }

        if ($this->userHasStaffRole($orderUser)) {
            return 'Khách lẻ';
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

    private function forceConfirmAllItems(Order $order): void
    {
        OrderItem::where('order_id', $order->id)
            ->where('is_confirmed', false)
            ->update(['is_confirmed' => true]);
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

        return in_array('staff', $roles, true)
            || in_array('admin', $roles, true)
            || in_array('super_admin', $roles, true);
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
