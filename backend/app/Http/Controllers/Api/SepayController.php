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
        
        DB::transaction(function () use ($order, $transaction, $amount, $data) {
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
                $inventory = \App\Models\ServiceInventory::firstOrCreate(
                    ['service_id' => $item->service_id],
                    ['quantity' => 0]
                );
                
                // Deduct inventory even if it goes negative, as payment is already received
                $inventory->decrement('quantity', $item->qty);
                $item->update(['stock_deducted' => true]);
            }

            if ($transaction) {
                // Determine if this exact transaction was for this payment?
                // Just use the first pending one for simplicity, or find one with method='mobile'
                if ($transaction->amount <= $amount) {
                    $transaction->update([
                        'status' => 'success',
                        'method' => 'mobile', // Ensure method is mobile/transfer
                        'amount' => $amount, // Update amount to actual received?
                        'reference' => 'SEPAY-' . ($data['id'] ?? Str::random(8)),
                    ]);
                }
            } else {
                // Create new success transaction
                $transaction = Transaction::create([
                    'order_id' => $order->id,
                    'user_id' => $order->user_id, // Or null if unknown, but order has user
                    'customer_name' => $order->customer_name,
                    'amount' => $amount,
                    'method' => 'mobile',
                    'status' => 'success',
                    'reference' => 'SEPAY-' . ($data['id'] ?? Str::random(8)),
                ]);
            }

            // Update Order
            // Recalculate paid?
            $totalPaid = $order->transactions()->where('status', 'success')->sum('amount');
            $order->update([
                'total_paid' => $totalPaid,
                'status' => 'completed'
            ]);
            
            if ($order->table) {
                $order->table->update(['status_id' => 1]);
            }
        });
        
        if ($transaction) {
             event(new TransactionConfirmed($transaction));
        }
    }
}
