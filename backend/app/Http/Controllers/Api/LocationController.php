<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class LocationController extends Controller
{
    private $baseUrl = 'https://provinces.open-api.vn/api/v2';

    public function getProvinces()
    {
        return Cache::remember('provinces_list', 86400, function () {
            $response = Http::get("{$this->baseUrl}/p/");
            return $response->json();
        });
    }

    public function getProvinceDetails(Request $request, $code)
    {
        // V2 blocks depth=3. We simulate it by fetching districts then their wards.
        $cacheKey = "province_{$code}_v2_full";

        return Cache::remember($cacheKey, 86400 * 7, function () use ($code) {
            // 1. Get Province + Districts
            $provinceRes = Http::get("{$this->baseUrl}/p/{$code}", ['depth' => 2]);
            $provinceData = $provinceRes->json();

            if (empty($provinceData['districts'])) {
                return $provinceData;
            }

            // 2. Fetch Wards for each District in parallel
            $districts = $provinceData['districts'];
            Log::info("Fetching wards for " . count($districts) . " districts of province $code");
            
            $responses = Http::pool(function (\Illuminate\Http\Client\Pool $pool) use ($districts) {
                foreach ($districts as $district) {
                    // Use string key for pool
                    $pool->as((string)$district['code'])->get("{$this->baseUrl}/d/{$district['code']}", ['depth' => 2]);
                }
            });

            // 3. Merge Wards back into Province Data
            foreach ($provinceData['districts'] as &$district) {
                $key = (string)$district['code'];
                if (isset($responses[$key]) && $responses[$key]->ok()) {
                    $districtData = $responses[$key]->json();
                    $district['wards'] = $districtData['wards'] ?? [];
                } else {
                    Log::warning("Failed to fetch wards for district $key");
                    $district['wards'] = [];
                }
            }

            return $provinceData;
        });
    }
}
