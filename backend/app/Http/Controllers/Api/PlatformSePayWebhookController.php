<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PlatformSePayWebhookController extends Controller
{
    public function handle(Request $request, $token)
    {
        $settings = \App\Models\SettingPlatform::first();
        
        if (!$settings || $settings->sepay_webhook_token !== $token) {
             Log::warning("Platform SePay Webhook: Invalid Token. Received: {$token}");
             return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $data = $request->all();
        $content = $data['content'] ?? '';
        $amount = floatval($data['transferAmount'] ?? 0);

        Log::info("Platform SePay Webhook Received: " . $content . " - Amount: " . $amount);

        // Try to find by Transaction Code
        // Regex to find potential code: GH[A-Z0-9]+
        // Example: GHSTORE1234
        if (preg_match('/(GH[A-Z0-9]+)/i', $content, $matches)) {
            $code = $matches[1];
            
            $transaction = \App\Models\PlatformTransaction::where('transaction_code', $code)
                ->where('status', 'pending')
                ->first();

            if ($transaction) {
                // Check amount
                // Allow small difference? Or strict?
                if ($amount >= $transaction->amount) {
                    DB::beginTransaction();
                    try {
                        // Update Transaction
                        $transaction->update([
                            'status' => 'paid',
                            'paid_at' => now(),
                        ]);

                        // Update Store
                        $store = $transaction->store;
                        $monthsToAdd = $transaction->months;

                        $now = now();
                        if (!$store->expires_at || $store->expires_at->isPast()) {
                             // If expired, start from NOW (or today)
                             $newExpiry = $now->addMonths($monthsToAdd);
                        } else {
                             // If active, extend
                             $newExpiry = $store->expires_at->addMonths($monthsToAdd);
                        }

                        $store->expires_at = $newExpiry;
                        $store->is_active = true;
                        $store->save();

                        DB::commit();
                        Log::info("Platform Txn Paid: {$code}. Store {$store->slug} extended by {$monthsToAdd} months.");
                        return response()->json(['success' => true, 'message' => 'Transaction processed']);

                    } catch (\Exception $e) {
                         DB::rollBack();
                         Log::error("Platform Txn Error: " . $e->getMessage());
                         return response()->json(['success' => false, 'message' => 'Server Error'], 500);
                    }
                } else {
                    Log::warning("Platform Txn Underpayment: {$code}. Expected {$transaction->amount}, got {$amount}");
                     // Do not fail, just log? Or return success false?
                     // Return success true to stop retries but log it?
                     return response()->json(['success' => false, 'message' => 'Insufficient amount']);
                }
            }
        }

        // Fallback or Legacy check (if needed) - For now request is strict on Transaction Table
        Log::info("Platform SePay: No matching pending transaction found for content: {$content}");

        return response()->json(['success' => true, 'message' => 'Ignored: No matching transaction']);
    }
}
