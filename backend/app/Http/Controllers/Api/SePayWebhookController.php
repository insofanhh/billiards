<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Events\TransactionConfirmed;

class SePayWebhookController extends Controller
{
    /**
     * Handle incoming webhook from SePay.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function handle(Request $request)
    {
        // 1. Authenticate the request
        $sepayApiKey = env('SEPAY_API_KEY');
        $incomingApiKey = $request->header('Authorization');
        $incomingDirectKey = $request->header('SEPAY_API_KEY');

        // Log for debugging
        Log::info("SePay Webhook Auth Check", [
            'expected' => $sepayApiKey,
            'received_auth' => $incomingApiKey,
            'received_direct' => $incomingDirectKey,
            // 'all_headers' => $request->headers->all() // Uncomment if need full headers debug
        ]);

        // Support multiple formats
        $isValidApiKey = false;
        
        // Format 1: Authorization: Apikey YOUR_KEY
        if ($incomingApiKey && str_contains(strtolower($incomingApiKey), 'apikey')) {
            $extractedKey = trim(str_ireplace('Apikey', '', $incomingApiKey));
            if ($extractedKey === $sepayApiKey) {
                $isValidApiKey = true;
            }
        }
        
        // Format 2: Authorization: YOUR_KEY (Direct - SePay production format)
        if (!$isValidApiKey && $incomingApiKey === $sepayApiKey) {
            $isValidApiKey = true;
        }
        
        // Format 3: SEPAY_API_KEY: YOUR_KEY (Custom header)
        if (!$isValidApiKey && $incomingDirectKey === $sepayApiKey) {
            $isValidApiKey = true;
        }

        if (!$isValidApiKey) {
            Log::warning("SePay Webhook: Unauthorized attempt", [
                'received_auth' => $incomingApiKey,
                'received_direct' => $incomingDirectKey,
            ]);
            return response()->json([
                'success' => false, 
                'message' => 'Unauthorized'
            ], 401);
        }
        
        Log::info("SePay Webhook: Authentication successful");

        // 2. Extract data
        $data = $request->all();
        $transferContent = $data['content'] ?? ''; // Content: "TKPBMS TXN-ZVI9APD0ZZ"
        $transferAmount = floatval($data['transferAmount'] ?? 0);

        // --- BẮT ĐẦU CẬP NHẬT LOGIC REGEX ---

        // Log lại nội dung gốc để debug
        Log::info("SePay Webhook Content Raw: " . $transferContent);

        // 3. Find Transaction Reference from Content using Improved Regex
        // Regex này linh hoạt hơn:
        // - Tìm chữ "TXN" (không phân biệt hoa thường)
        // - Chấp nhận ký tự ngăn cách: gạch ngang (-), gạch dưới (_), dấu chấm (.), hoặc khoảng trắng (\s)
        // - Bắt lấy chuỗi Alphanumeric phía sau (Mã giao dịch)
        preg_match('/TXN[-_.\s]*([A-Z0-9]+)/i', $transferContent, $matches);
        
        if (empty($matches[1])) {
            Log::warning("SePay: Regex failed. Content does not contain valid TXN code: " . $transferContent);
            return response()->json(['success' => false, 'message' => 'No transaction code found in content']);
        }

        // Lấy phần đuôi mã code tìm được (Ví dụ: ZVI9APD0ZZ) và đưa về chữ in hoa
        $codeSuffix = strtoupper($matches[1]);

        // Tái tạo lại định dạng chuẩn trong Database (TXN-XXXX) để tìm kiếm chính xác
        // Vì trong DB bạn lưu đầy đủ cả tiền tố "TXN-", nên ta cần nối chuỗi lại.
        $transactionCode = 'TXN-' . $codeSuffix;

        Log::info("SePay: Extracted & Reconstructed Code: " . $transactionCode);

        // --- KẾT THÚC CẬP NHẬT LOGIC REGEX ---

        // 4. Find the Transaction record
        $transaction = Transaction::where('reference', $transactionCode)
            ->where('status', '!=', 'success') // Only process if not already success
            ->first();

        if (!$transaction) {
            Log::info("SePay: Transaction not found or processed. Code: " . $transactionCode);
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
                    // Không cộng thêm total_paid vì đã được set khi tạo transaction (logic của bạn)
                    // Chỉ cần set order status = completed
                    $order->status = 'completed';
                    $order->save();
                    
                    // Update table status về "Trống"
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
                    // Không throw lỗi ở đây để tránh rollback transaction đã thành công
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