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
        ]);
    }
}

