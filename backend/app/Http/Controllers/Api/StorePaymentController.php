<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StorePaymentController extends Controller
{
    /**
     * Get payment information for a specific store.
     */
    public function getPaymentInfo(Request $request, string $slug): JsonResponse
    {
        $store = Store::where('slug', $slug)->firstOrFail();

        if (!$store->hasPaymentConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not configured for this store',
                'data' => null,
            ], 503);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'bank_account_no' => $store->bank_account_no,
                'bank_name' => $store->bank_name,
                'bank_account_name' => $store->bank_account_name,
            ],
        ]);
    }

    /**
     * Get webhook URL for store (admin only).
     */
    public function getWebhookUrl(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $store = Store::find(app('currentStoreId'));

        if (!$store) {
            return response()->json([
                'success' => false,
                'message' => 'Store not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'webhook_url' => $store->getWebhookUrl(),
                'webhook_token' => $store->webhook_token,
            ],
        ]);
    }
    
    /**
     * Get current payment settings (admin only).
     */
    public function getSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $store = Store::find(app('currentStoreId'));

        if (!$store) {
            return response()->json([
                'success' => false,
                'message' => 'Store not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'bank_account' => $store->bank_account_no,
                'bank_name' => $store->bank_name,
                'bank_account_name' => $store->bank_account_name,
                'has_sepay_key' => filled($store->sepay_api_key),
                'webhook_url' => $store->getWebhookUrl(),
            ],
        ]);
    }
    
    /**
     * Update payment settings (admin only).
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $request->validate([
            'bank_account_no' => 'required|string|max:20',
            'bank_name' => 'required|string|max:255',
            'bank_account_name' => 'nullable|string|max:255',
            'sepay_api_key' => 'required|string|max:255',
        ]);

        $store = Store::find(app('currentStoreId'));

        if (!$store) {
            return response()->json([
                'success' => false,
                'message' => 'Store not found',
            ], 404);
        }

        $store->update([
            'bank_account_no' => $request->bank_account_no,
            'bank_name' => $request->bank_name,
            'bank_account_name' => $request->bank_account_name,
            'sepay_api_key' => $request->sepay_api_key,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment settings updated successfully',
            'data' => [
                'bank_account' => $store->bank_account_no,
                'bank_name' => $store->bank_name,
                'bank_account_name' => $store->bank_account_name,
                'webhook_url' => $store->getWebhookUrl(),
            ],
        ]);
    }
}
