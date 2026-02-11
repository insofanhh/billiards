<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CategoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryServiceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = CategoryService::query();

        if ($user->store_id) {
            $query->where('store_id', $user->store_id);
        } elseif ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        $categories = $query->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function getByStore(Request $request, $storeId)
    {
        $categories = CategoryService::where('store_id', $storeId)
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $query = CategoryService::where('id', $id);

        if ($user->store_id) {
            $query->where('store_id', $user->store_id);
        }

        $category = $query->firstOrFail();

        return response()->json(['data' => $category]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $storeId = $user->store_id ?: $request->store_id;

        if (!$storeId) {
             return response()->json(['message' => 'Store ID is required'], 400);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('category_services')->where(function ($query) use ($storeId) {
                    return $query->where('store_id', $storeId);
                }),
            ],
            'description' => 'nullable|string',
            'sort_order' => 'integer|min:0',
            'active' => 'boolean',
        ]);

        $validated['store_id'] = $storeId;
        $validated['slug'] = Str::slug($validated['name']);

        // Ensure unique slug per store
        $originalSlug = $validated['slug'];
        $count = 1;
        while (CategoryService::where('store_id', $storeId)->where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $originalSlug . '-' . $count++;
        }

        $category = CategoryService::create($validated);

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $query = CategoryService::where('id', $id);

        if ($user->store_id) {
            $query->where('store_id', $user->store_id);
        }

        $category = $query->firstOrFail();

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('category_services')->where(function ($query) use ($category) {
                    return $query->where('store_id', $category->store_id);
                })->ignore($category->id),
            ],
            'description' => 'nullable|string',
            'sort_order' => 'integer|min:0',
            'active' => 'boolean',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
            // Ensure unique slug per store (excluding current)
            $originalSlug = $validated['slug'];
            $count = 1;
            while (CategoryService::where('store_id', $category->store_id)
                ->where('slug', $validated['slug'])
                ->where('id', '!=', $id)
                ->exists()) {
                $validated['slug'] = $originalSlug . '-' . $count++;
            }
        }

        $category->update($validated);

        return response()->json(['data' => $category]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $query = CategoryService::where('id', $id);

        if ($user->store_id) {
            $query->where('store_id', $user->store_id);
        }

        $category = $query->firstOrFail();
        
        // Check if services depend on it? Usually handled by DB reference or just let it fail/cascade
        // Checking for safety
        if ($category->services()->exists()) {
            return response()->json(['message' => 'Cannot delete category containing services.'], 409);
        }

        $category->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
