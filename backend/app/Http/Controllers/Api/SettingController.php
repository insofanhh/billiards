<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function banners(): JsonResponse
    {
        $setting = Setting::query()->latest('id')->first();

        return response()->json([
            'banners' => $setting?->image_banner_urls ?? [],
        ]);
    }
}

