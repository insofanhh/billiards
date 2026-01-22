<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;

class PublicStoreController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $store = Store::where('slug', $slug)->firstOrFail(['id', 'name', 'slug']);

        return response()->json($store);
    }
}
