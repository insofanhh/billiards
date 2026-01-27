<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Settings\GeneralSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SettingController extends Controller
{
    /**
     * Return banner URLs sourced from the general settings store.
     */
    public function banners(): JsonResponse
    {
        $settings = app(GeneralSettings::class);
        $disk = Storage::disk('public');
        $seoSettings = \App\Models\SettingPlatform::first();

        $banners = collect($settings->image_banner ?? [])
            ->filter(fn ($path) => filled($path))
            ->map(function (string $path) use ($disk): string {
                if (Str::startsWith($path, ['http://', 'https://'])) {
                    return $path;
                }

                return $disk->url($path);
            })
            ->values()
            ->all();

        return response()->json([
            'banners' => $banners,
            'banner_video_url' => $settings->banner_video_url,
            'seo_title' => $seoSettings?->seo_title,
            'seo_description' => $seoSettings?->seo_description,
            'seo_keywords' => $seoSettings?->seo_keywords,
            'support_messenger' => $seoSettings?->support_messenger,
            'support_hotline' => $seoSettings?->support_hotline,
            'support_youtube' => $seoSettings?->support_youtube,
            'support_telegram' => $seoSettings?->support_telegram,
            'learn_more_url' => $seoSettings?->learn_more_url,
        ]);
    }
}
