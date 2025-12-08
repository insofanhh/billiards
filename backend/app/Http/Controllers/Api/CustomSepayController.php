<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use SePay\SePay\Datas\SePayWebhookData;
use SePay\SePay\Events\SePayWebhookEvent;

class CustomSepayController extends Controller
{
    public function webhook(Request $request)
    {
        try {
            // Log incoming request for debugging
            // Log::info('Sepay Webhook Incoming:', $request->all());

            // Validate Auth
            $token = config('sepay.webhook_token');
            // Check Authorization header: 'Apikey TOKEN' or 'Bearer TOKEN'
            $authHeader = $request->header('Authorization');
            
            // Basic check - package usually does strict check. 
            // If token is set and header doesn't match, 401.
            if ($token && !str_contains($authHeader, $token)) {
                 return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $data = new SePayWebhookData(
                accountNumber: $request->input('accountNumber', ''),
                gateway: $request->input('gateway', ''),
                transactionDate: $request->input('transactionDate', ''),
                subAccount: $request->input('subAccount') ?? '', // Fix null -> empty string
                code: $request->input('code') ?? '',             // Fix null -> empty string
                content: $request->input('content', ''),
                transferType: $request->input('transferType', ''),
                description: $request->input('description', ''),
                transferAmount: $request->input('transferAmount', 0),
                referenceCode: $request->input('referenceCode') ?? '', // Fix null -> empty string
                accumulated: $request->input('accumulated', 0),
                id: $request->input('id', 0)
            );

            event(new SePayWebhookEvent(
                info: 'from_custom_controller',
                sePayWebhookData: $data
            ));

            return response()->json(['success' => true]);

        } catch (\Throwable $e) {
            Log::error('Sepay Webhook Failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
