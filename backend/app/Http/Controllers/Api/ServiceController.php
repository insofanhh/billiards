<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Service::where('active', true)
            ->with('categoryService');
            
        if ($user && $user->store_id) {
            $query->where('store_id', $user->store_id);
        } elseif ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }
            
        // If user->store_id is null (Super Admin), we return all (or scoped by other params)
        // No else needed as we want to default to "all active" if no store_id restriction.
        
        $services = $query->get();
        return ServiceResource::collection($services);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        // Validation rules
        $rules = [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_service_id' => 'required|exists:category_services,id',
            'price' => 'required|numeric|min:0',
            'charge_type' => 'required|string|max:50',
            'active' => 'boolean',
            'image' => 'nullable|string',
        ];

        // If Super Admin, require store_id
        if (!$user->store_id) {
            $rules['store_id'] = 'required|exists:stores,id';
        }

        $validated = $request->validate($rules);

        // Assign store_id
        if ($user->store_id) {
            $validated['store_id'] = $user->store_id;
        }
        // Else it's already in $validated from request

        $service = Service::create($validated);

        return new ServiceResource($service);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $query = Service::where('id', $id);
        
        if ($user->store_id) {
            $query->where('store_id', $user->store_id);
        }
        
        $service = $query->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'category_service_id' => 'sometimes|required|exists:category_services,id',
            'price' => 'sometimes|required|numeric|min:0',
            'charge_type' => 'sometimes|required|string|max:50',
            'active' => 'boolean',
            'image' => 'nullable|string',
        ]);

        $service->update($validated);

        return new ServiceResource($service);
    }
}
