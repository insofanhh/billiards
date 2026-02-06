<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SettingPlatform;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PlatformSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = SettingPlatform::first();

        return response()->json([
            'seo_title' => $settings?->seo_title,
            'seo_description' => $settings?->seo_description,
            'seo_keywords' => $settings?->seo_keywords,
            'support_messenger' => $settings?->support_messenger,
            'support_hotline' => $settings?->support_hotline,
            'support_youtube' => $settings?->support_youtube,
            'support_telegram' => $settings?->support_telegram,
            'learn_more_url' => $settings?->learn_more_url,
            'trial_days' => $settings?->trial_days ?? 7,
            'bank_name' => $settings?->bank_name,
            'bank_account' => $settings?->bank_account,
            'bank_account_name' => $settings?->bank_account_name,
            'sepay_api_key' => $settings?->sepay_api_key,
            'sepay_webhook_token' => $settings?->sepay_webhook_token,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'seo_title' => 'nullable|string|max:60',
            'seo_description' => 'nullable|string|max:160',
            'seo_keywords' => 'nullable|string|max:255',
            'support_messenger' => 'nullable|string|max:255',
            'support_hotline' => 'nullable|string|max:255',
            'support_telegram' => 'nullable|string|max:255',
            'learn_more_url' => 'nullable|string|max:255',
            'trial_days' => 'nullable|integer|min:0',
            
            // Payment Settings
            'bank_name' => 'nullable|string|max:50',
            'bank_account' => 'nullable|string|max:50',
            'bank_account_name' => 'nullable|string|max:100',
            'sepay_api_key' => 'nullable|string|max:100',
        ]);

        $settings = SettingPlatform::firstOrNew();
        
        $settings->seo_title = $validated['seo_title'] ?? null;
        $settings->seo_description = $validated['seo_description'] ?? null;
        $settings->seo_keywords = $validated['seo_keywords'] ?? null;
        $settings->support_messenger = $validated['support_messenger'] ?? null;
        $settings->support_hotline = $validated['support_hotline'] ?? null;
        $settings->support_youtube = $validated['support_youtube'] ?? null;
        $settings->support_telegram = $validated['support_telegram'] ?? null;
        $settings->learn_more_url = $validated['learn_more_url'] ?? null;
        $settings->trial_days = $validated['trial_days'] ?? 7;
        
        // Save Payment Settings
        $settings->bank_name = $validated['bank_name'] ?? null;
        $settings->bank_account = $validated['bank_account'] ?? null;
        $settings->bank_account_name = $validated['bank_account_name'] ?? null;
        $settings->sepay_api_key = $validated['sepay_api_key'] ?? null;

        // Auto-generate webhook token if not exists
        if (empty($settings->sepay_webhook_token)) {
            $settings->sepay_webhook_token = \Illuminate\Support\Str::random(32);
        }
        
        $settings->save();

        return response()->json([
            'message' => 'Settings updated successfully',
            'settings' => $settings
        ]);
    }
}
