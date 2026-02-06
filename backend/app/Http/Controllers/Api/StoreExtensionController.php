<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StoreExtensionController extends Controller
{
    public function checkStatus($slug)
    {
        \Illuminate\Support\Facades\Log::info("CheckStatus called for slug: " . $slug);
        $store = Store::where('slug', $slug)->first();
        
        if (!$store) {
             \Illuminate\Support\Facades\Log::error("CheckStatus: Store not found for slug: " . $slug);
             return response()->json(['message' => 'Store not found'], 404);
        }

        return response()->json([
            'id' => $store->id,
            'slug' => $store->slug,
            'name' => $store->name,
            'expires_at' => $store->expires_at,
            'is_expired' => $store->expires_at ? $store->expires_at->isPast() : false,
            'profile_completed' => $this->isProfileComplete($store),
            'profile' => [
                'birthday' => $store->birthday,
                'cccd' => $store->cccd,
                'phone_contact' => $store->phone_contact,
                'phone_contact' => $store->phone_contact,
                'email_contact' => $store->email_contact ?? $store->owner->email,
                'province' => $store->province,
                'province' => $store->province,
                'ward' => $store->ward,
                'address_detail' => $store->address_detail,
            ]
        ]);
    }

    public function updateProfile(Request $request, $slug)
    {
        $store = Store::where('slug', $slug)->firstOrFail();

        $validated = $request->validate([
            'birthday' => 'required|date',
            'cccd' => 'required|string|max:50',
            'phone_contact' => 'required|string|max:20',
            'email_contact' => 'required|email|max:255',
            'country' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            // 'district' => 'required|string|max:100', // Removed
            'ward' => 'required|string|max:100',
            'address_detail' => 'required|string|max:255',
        ]);

        $store->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'profile_completed' => true
        ]);
    }

    public function getPaymentInfo(Request $request, $slug)
    {
        $store = Store::where('slug', $slug)->firstOrFail();

        if (!$this->isProfileComplete($store)) {
            return response()->json(['message' => 'Please complete profile first'], 400);
        }
        
        $months = $request->input('months', 1);
        $amount = 100000 * $months;

        // 1. Guard against creating new transaction if one was JUST paid (race condition/refresh)
        $recentPaid = \App\Models\PlatformTransaction::where('store_id', $store->id)
            ->where('status', 'paid')
            ->where('paid_at', '>=', now()->subMinutes(2))
            ->first();

        if ($recentPaid) {
            return response()->json([
                 'message' => 'Payment already received',
                 'is_paid' => true 
            ], 200); // Or specific code frontend can handle
        }
        
        // 2. Find existing pending transaction or create new one
        // Use latest() to get the most relevant one if duplicates exist
        $transaction = \App\Models\PlatformTransaction::where('store_id', $store->id)
            ->where('status', 'pending')
            ->latest()
            ->first();

        // 3. Cleanup duplicates if any (keep $transaction, delete others)
        if ($transaction) {
             \App\Models\PlatformTransaction::where('store_id', $store->id)
                ->where('status', 'pending')
                ->where('id', '!=', $transaction->id)
                ->delete();

            // Update existing transaction if months changed
            if ($transaction->months != $months) {
                $transaction->update([
                    'months' => $months,
                    'amount' => $amount,
                    'description' => "Renewal for {$months} month(s)",
                ]);
            }
        } else {
            // Create new transaction
            // Sanitize slug to remove hyphens or special chars to match Webhook Regex (GH[A-Z0-9]+)
            $cleanSlug = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $store->slug));
            $code = "GH" . $cleanSlug . rand(1000, 9999);
            
            $transaction = \App\Models\PlatformTransaction::create([
                'store_id' => $store->id,
                'amount' => $amount,
                'months' => $months,
                'status' => 'pending',
                'transaction_code' => $code,
                'content' => $code,
                'description' => "Renewal for {$months} month(s)",
            ]);
        }
        
        $transferContent = $transaction->transaction_code;
        
        $settings = \App\Models\SettingPlatform::first();
        
        $platformBankAccount = $settings->bank_account ?? config('app.platform_bank_account', '');
        $platformBankName = $settings->bank_name ?? config('app.platform_bank_name', '');
        $platformBankOwner = $settings->bank_account_name ?? config('app.platform_bank_owner', '');

        return response()->json([
            'amount' => $amount,
            'bank_account' => $platformBankAccount,
            'bank_name' => $platformBankName,
            'bank_owner' => $platformBankOwner,
            'content' => $transferContent,
            'qr_url' => "https://qr.sepay.vn/img?acc={$platformBankAccount}&bank={$platformBankName}&amount={$amount}&des={$transferContent}",
        ]);
    }

    private function isProfileComplete(Store $store)
    {
        return $store->birthday && $store->cccd && $store->phone_contact && 
               $store->province && $store->ward && $store->address_detail;
    }
}
