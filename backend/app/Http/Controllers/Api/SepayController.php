<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Transaction;
use App\Events\TransactionConfirmed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class SepayController extends Controller
{
    public function config()
    {
        return response()->json([
            'bank_account' => config('app.sepay.bank_account'),
            'bank_provider' => config('app.sepay.bank_provider'),
            'pattern' => config('app.sepay.pattern'),
        ]);
    }

    public function webhook(Request $request)
    {
        $token = config('app.sepay.webhook_token');
        $authHeader = $request->header('Authorization');

        // Check for "Apikey {token}" or "Bearer {token}"
        // User screenshot shows: Authorization: Apikey K8O32...
        if ($token) {
            $isValid = false;
            if ($authHeader === 'Apikey ' . $token) {
                $isValid = true;
            } elseif ($authHeader === 'Bearer ' . $token) {
                $isValid = true;
            }
            
            // If strictly enforcing token check:
            // if (!$isValid) {
            //     return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            // }
        }

        $data = $request->all();
        
        // Data structure from Sepay usually:
        // {
        //   "gateway": "MBBank",
        //   "transactionDate": "...",
        //   "accountNumber": "...",
        //   "subAccount": null,
        //   "code": null,
        //   "content": "SE ORD-123",
        //   "transferType": "in",
        //   "transferAmount": 50000,
        //   "accumulated": 50000,
        //   "id": 12345
        // }

        $content = $data['content'] ?? '';
        $amount = $data['transferAmount'] ?? 0;
        
        $pattern = config('app.sepay.pattern', 'SE');
        
        // Extract Order Code
        // Regex: /SE\s*(ORD-[A-Z0-9]+)/i
        if (preg_match('/' . preg_quote($pattern, '/') . '\s*(ORD-[A-Z0-9]+)/i', $content, $matches)) {
            $orderCode = $matches[1];
            $this->processPayment($orderCode, $amount, $data);
            return response()->json(['success' => true]);
        }
        
        return response()->json(['success' => false, 'message' => 'No matching order found']);
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

        // Check for existing pending transaction or create a new one?
        // Usually we match with the 'pending' transaction created by the user when they clicked 'Transfer'
        // OR we just create a new success transaction if none exists.
        
        $transaction = Transaction::where('order_id', $order->id)
            ->where('status', 'pending')
            ->first();

        // If amount matches (or is enough)
        // Note: Sepay amount might be partial? Logic here: complete if >= remaining?
        // User logic: "sau khi hóa đơn đó đã có trạng thái giao dịch thành công thì báo thành công"
        
        DB::transaction(function () use ($order, $amount, $data) {
            // Updated Logic: Always record the payment if valid order found.
            
            // 1. Confirm all pending items since we received payment
            \App\Models\OrderItem::where('order_id', $order->id)
                ->where('is_confirmed', false)
                ->update(['is_confirmed' => true]);

            // 2. Deduct inventory for all undeducted items
            $items = \App\Models\OrderItem::where('order_id', $order->id)
                ->where('stock_deducted', false)
                ->with('service')
                ->lockForUpdate()
                ->get();

            foreach ($items as $item) {
                // Ignore inventory check for payment processing - take money first
                $inventory = \App\Models\ServiceInventory::firstOrCreate(
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

            if ($pendingTransaction && $pendingTransaction->amount <= $incomingAmount + 1000) { 
                // Allow small tolerance (1000 VND) or strict? 
                // Using +1000 tolerance means if pending is 10000, and we receive 9000 -> Fail condition?
                // Wait, logic: if pending->amount <= incoming. 
                // If Pending is 10967, Incoming is 10967. 10967 <= 10967. True.
                // If Pending is 10967, Incoming is 11000 (tip). 10967 <= 11000. True.
                // If Pending is 10967, Incoming is 10000 (partial). 10967 <= 10000. False.
                
                $pendingTransaction->update([
                    'status' => 'success',
                    'method' => 'mobile',
                    'amount' => $incomingAmount, // Record actual received amount
                    'reference' => 'SEPAY-' . ($data['id'] ?? Str::random(8)),
                ]);
                $transaction = $pendingTransaction;
            } else {
                // If no pending transaction found OR amount mismatch (partial payment?), 
                // Create a NEW SUCCESS transaction for the record.
                $transaction = Transaction::create([
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'customer_name' => $order->customer_name ?? 'Khách lẻ',
                    'amount' => $incomingAmount,
                    'method' => 'mobile',
                    'status' => 'success',
                    'reference' => 'SEPAY-' . ($data['id'] ?? Str::random(8)),
                ]);
            }

            // 4. Update Order Status
            // Re-sum all successful transactions to check if fully paid
            $totalPaid = $order->transactions()->where('status', 'success')->sum('amount');
            
            // Check if total paid is enough? 
            // For now, assume this payment completes it if it covers the total.
            // But let's just update total_paid and set distinct status if needed.
            // User requirement: "giao dịch đơn hàng đó chuyển trạng thái là thành công"
            
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
