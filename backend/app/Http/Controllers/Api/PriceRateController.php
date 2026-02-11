<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PriceRate;
use App\Models\TableType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PriceRateController extends Controller
{
    public function index(Request $request, $tableTypeId)
    {
        $user = $request->user();
        if (!$user->store_id && !$request->store_id) {
             return response()->json(['message' => 'Store ID is required'], 400);
        }

        $storeId = $user->store_id ?: $request->store_id;

        $tableType = TableType::where('id', $tableTypeId)
            ->where('store_id', $storeId)
            ->firstOrFail();

        $priceRates = PriceRate::where('table_type_id', $tableType->id)
            ->where('store_id', $storeId)
            ->orderBy('priority', 'desc')
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json(['data' => $priceRates]);
    }

    public function getAll(Request $request)
    {
        // Ideally checking for Super Admin or Platform Admin here
        // For now, assuming auth:sanctum is sufficient as per request implies visibility
        
        $priceRates = PriceRate::with(['tableType', 'tableType.store'])
            ->orderBy('store_id')
            ->orderBy('table_type_id')
            ->orderBy('priority', 'desc')
            ->get();

        return response()->json(['data' => $priceRates]);
    }

    public function getByStore(Request $request, $storeId)
    {
        $priceRates = PriceRate::with(['tableType'])
            ->where('store_id', $storeId)
            ->orderBy('table_type_id')
            ->orderBy('priority', 'desc')
            ->get();

        return response()->json(['data' => $priceRates]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $storeId = $user->store_id ?: $request->store_id;

        if (!$storeId) {
             return response()->json(['message' => 'Store ID is required'], 400);
        }

        $validated = $request->validate([
            'table_type_id' => [
                'required',
                Rule::exists('table_types', 'id')->where(function ($query) use ($storeId) {
                    return $query->where('store_id', $storeId);
                }),
            ],
            'price_per_hour' => 'required|numeric|min:0',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|different:start_time',
            'day_of_week' => 'nullable|array',
            'day_of_week.*' => 'integer|min:0|max:6',
            'priority' => 'integer',
            'active' => 'boolean',
        ]);

        $validated['store_id'] = $storeId;

        $priceRate = PriceRate::create($validated);

        return response()->json(['data' => $priceRate], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $storeId = $user->store_id ?: $request->store_id;
        
        $priceRate = PriceRate::where('id', $id)
            ->where('store_id', $storeId)
            ->firstOrFail();

        $validated = $request->validate([
            'price_per_hour' => 'sometimes|numeric|min:0',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|different:start_time',
            'day_of_week' => 'nullable|array',
            'day_of_week.*' => 'integer|min:0|max:6',
            'priority' => 'integer',
            'active' => 'boolean',
        ]);

        $priceRate->update($validated);

        return response()->json(['data' => $priceRate]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $storeId = $user->store_id ?: $request->store_id;
        
        $priceRate = PriceRate::where('id', $id)
            ->where('store_id', $storeId)
            ->firstOrFail();

        $priceRate->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
