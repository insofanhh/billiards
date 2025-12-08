<?php

namespace App\Listeners;

use SePay\SePay\Events\SePayWebhookEvent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\Transaction;
use App\Models\OrderItem;
use App\Models\ServiceInventory;
use App\Events\TransactionConfirmed;

class SePayWebhookListener
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(SePayWebhookEvent $event): void
    {
        $data = $event->sePayWebhookData;

        // Xử lý tiền vào tài khoản
        if ($data->transferType === 'in') {
            $content = $data->content;
            $amount = $data->transferAmount;
            
            $pattern = config('sepay.pattern', 'SE');
            
            // Regex: /SE\s*(ORD-[A-Z0-9]+)/i
            if (preg_match('/' . preg_quote($pattern, '/') . '\s*(ORD-[A-Z0-9]+)/i', $content, $matches)) {
                $orderCode = $matches[1];
                $this->processPayment($orderCode, $amount, $data);
            }
        }
    }

    private function processPayment($orderCode, $amount, $data)
    {
        $order = Order::where('order_code', $orderCode)
            ->whereIn('status', ['completed', 'pending_end', 'active']) 
            ->first();

        if (!$order) {
            Log::warning("Sepay: Order not found for code $orderCode");
            return;
        }

        DB::transaction(function () use ($order, $amount, $data) {
            // Updated Logic: Always record the payment if valid order found.
            
            // 1. Confirm all pending items since we received payment
            OrderItem::where('order_id', $order->id)
                ->where('is_confirmed', false)
                ->update(['is_confirmed' => true]);

            // 2. Deduct inventory for all undeducted items
            $items = OrderItem::where('order_id', $order->id)
                ->where('stock_deducted', false)
                ->with('service')
                ->lockForUpdate()
                ->get();

            foreach ($items as $item) {
                // Ignore inventory check for payment processing - take money first
                $inventory = ServiceInventory::firstOrCreate(
                    ['service_id' => $item->service_id],
                    ['quantity' => 0]
                );
                $inventory->decrement('quantity', $item->qty);
                $item->update(['stock_deducted' => true]);
            }

            // 3. Handle Transaction
            $pendingTransaction = Transaction::where('order_id', $order->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->first();

            $transaction = null;
            $incomingAmount = (float) $amount; // Ensure float comparison

            if ($pendingTransaction) { 
                $pendingTransaction->update([
                    'status' => 'success',
                    'method' => 'mobile',
                    'amount' => $incomingAmount, 
                    'reference' => 'SEPAY-' . ($data->id ?? Str::random(8)),
                ]);
                $transaction = $pendingTransaction;
            } else {
                // Create new success transaction
                $transaction = Transaction::create([
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'customer_name' => $order->customer_name ?? 'Khách lẻ',
                    'amount' => $incomingAmount,
                    'method' => 'mobile',
                    'status' => 'success',
                    'reference' => 'SEPAY-' . ($data->id ?? Str::random(8)),
                ]);
            }

            // 4. Update Order Status
            $totalPaid = $order->transactions()->where('status', 'success')->sum('amount');
            
            $order->update([
                'total_paid' => $totalPaid,
                'status' => 'completed'
            ]);
            
            if ($order->table) {
                $order->table->update(['status_id' => 1]);
            }

            if ($transaction) {
                event(new TransactionConfirmed($transaction));
            }
        });
    }
}
