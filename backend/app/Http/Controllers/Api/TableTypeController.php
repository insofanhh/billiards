<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TableType;
use Illuminate\Http\Request;

class TableTypeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = TableType::query();
        
        if ($user->store_id) {
            $query->where('store_id', $user->store_id);
        } elseif ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }
        // If null, return all

        $tableTypes = $query->get();
        return response()->json(['data' => $tableTypes]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->store_id) {
             $request->validate([
                'store_id' => 'required|exists:stores,id',
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($user->store_id) {
            $validated['store_id'] = $user->store_id;
        } else {
             $validated['store_id'] = $request->store_id;
        }

        $tableType = TableType::create($validated);

        return response()->json(['data' => $tableType], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $query = TableType::where('id', $id);
            
        if ($user->store_id) {
            $query->where('store_id', $user->store_id);
        }
            
        $tableType = $query->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $tableType->update($validated);

        return response()->json(['data' => $tableType]);
    }
}
