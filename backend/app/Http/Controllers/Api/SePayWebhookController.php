<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Order;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Events\TransactionConfirmed;

class SePayWebhookController extends Controller
{
    /**
     * Handle incoming webhook from SePay (Multi-tenant support).
     *
     * @param Request $request
     * @param string|null $storeSlug
     * @param string|null $webhookToken
     * @return \Illuminate\Http\JsonResponse
     */
    public function handle(Request $request, ?string $storeSlug = null, ?string $webhookToken = null)
    {
        // 1. Resolve Store from URL parameters
        $store = null;
        
        if ($storeSlug && $webhookToken) {
            $store = Store::where('slug', $storeSlug)
                ->where('webhook_token', $webhookToken)
                ->first();

            if (!$store) {
                Log::warning("SePay Webhook: Invalid store or webhook token", [
                    'slug' => $storeSlug,
                    'token' => substr($webhookToken, 0, 10) . '...',
                ]);
                return response()->json([
                    'success' => false, 
                    'message' => 'Invalid webhook URL'
                ], 404);
            }

            Log::info("SePay Webhook: Store resolved by URL", [
                'store_id' => $store->id,
                'store_name' => $store->name,
            ]);
        }
        
        // Fallback: Resolve Store by Account Number in payload
        if (!$store && $request->has('accountNumber')) {
            $accNo = $request->input('accountNumber');
            $store = Store::where('bank_account_no', $accNo)->first();
            
            if ($store) {
                 Log::info("SePay Webhook: Store resolved by Account Number", [
                    'store_id' => $store->id,
                    'acc_no' => $accNo,
                ]);
            }
        }

        // 2. Authenticate the request
        $expectedApiKey = $store ? $store->sepay_api_key : env('SEPAY_API_KEY');
        $incomingApiKey = $request->header('Authorization');
        $incomingDirectKey = $request->header('SEPAY_API_KEY');

        Log::info("SePay Webhook Auth Check", [
            'store_id' => $store?->id,
            'has_expected_key' => filled($expectedApiKey),
            'received_auth' => $incomingApiKey ? 'present' : 'missing',
            'received_direct' => $incomingDirectKey ? 'present' : 'missing',
        ]);

        if (!$expectedApiKey) {
            Log::error("SePay Webhook: No API key configured", [
                'store_id' => $store?->id,
            ]);
            return response()->json([
                'success' => false, 
                'message' => 'Payment not configured'
            ], 503);
        }

        // Support multiple authentication formats
        $isValidApiKey = false;
        
        if ($incomingApiKey && str_contains(strtolower($incomingApiKey), 'apikey')) {
            $extractedKey = trim(str_ireplace('Apikey', '', $incomingApiKey));
            if ($extractedKey === $expectedApiKey) {
                $isValidApiKey = true;
            }
        }
        
        if (!$isValidApiKey && $incomingApiKey === $expectedApiKey) {
            $isValidApiKey = true;
        }
        
        if (!$isValidApiKey && $incomingDirectKey === $expectedApiKey) {
            $isValidApiKey = true;
        }

        if (!$isValidApiKey) {
            Log::warning("SePay Webhook: Unauthorized attempt", [
                'store_id' => $store?->id,
            ]);
            return response()->json([
                'success' => false, 
                'message' => 'Unauthorized'
            ], 401);
        }
        
        Log::info("SePay Webhook: Authentication successful", [
            'store_id' => $store?->id,
        ]);

        // 2. Extract data
        $data = $request->all();
        $transferContent = $data['content'] ?? '';
        $transferAmount = floatval($data['transferAmount'] ?? 0);

        // --- LOGIC REGEX ---

        Log::info("SePay Webhook Content Raw: " . $transferContent);

        // 3. Find Transaction Reference from Content using Improved Regex
        preg_match('/TXN[-_.\s]*([A-Z0-9]+)/i', $transferContent, $matches);
        
        if (empty($matches[1])) {
            Log::warning("SePay: Regex failed. Content does not contain valid TXN code: " . $transferContent);
            return response()->json(['success' => false, 'message' => 'No transaction code found in content']);
        }

        $codeSuffix = strtoupper($matches[1]);

        $transactionCode = 'TXN-' . $codeSuffix;

        Log::info("SePay: Extracted & Reconstructed Code: " . $transactionCode);

        // 4. Find the Transaction record (scoped to store if available)
        $query = Transaction::where('reference', $transactionCode)
            ->where('status', '!=', 'success');

        if ($store) {
            $query->where('store_id', $store->id);
        }

        $transaction = $query->first();

        if (!$transaction) {
            Log::info("SePay: Transaction not found or processed", [
                'code' => $transactionCode,
                'store_id' => $store?->id,
            ]);
            return response()->json(['success' => true, 'message' => 'Transaction not found or already processed']);
        }

        // 5. Process Payment Logic (Using DB Transaction for data integrity)
        DB::beginTransaction();
        try {
            // Check if transfer amount is sufficient (allowing small difference if needed)
            if ($transferAmount >= $transaction->amount) {
                
                // Update Related Order
                $order = Order::find($transaction->order_id);
                
                // Update Transaction Status
                $transaction->update([
                    'status' => 'success',
                    'updated_at' => now(),
                ]);

                if ($order) {
                    $order->status = 'completed';
                    $order->save();

                    if ($order->table) {
                        $order->table->update(['status_id' => 1]);
                    }
                }

                DB::commit();
                
                // Broadcast event to client
                try {
                    broadcast(new TransactionConfirmed($transaction))->toOthers();
                } catch (\Exception $e) {
                    Log::error("SePay Broadcast Error: " . $e->getMessage());
                }
                
                Log::info("SePay Webhook: Transaction {$transactionCode} success. Amount: {$transferAmount}");
                
                return response()->json(['success' => true, 'message' => 'Transaction success']);
            } else {
                DB::rollBack();
                Log::warning("SePay Webhook: Insufficient amount for {$transactionCode}. Sent: {$transferAmount}, Needed: {$transaction->amount}");
                return response()->json(['success' => false, 'message' => 'Amount mismatch']);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("SePay Webhook Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Server Error'], 500);
        }
    }
} 