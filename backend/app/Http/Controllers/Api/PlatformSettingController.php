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
            'support_youtube' => 'nullable|string|max:255',
            'support_telegram' => 'nullable|string|max:255',
            'learn_more_url' => 'nullable|string|max:255',
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
        
        $settings->save();

        return response()->json([
            'message' => 'Settings updated successfully',
            'settings' => $settings
        ]);
    }
}
