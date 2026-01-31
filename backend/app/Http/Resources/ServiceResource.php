<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'store_id' => $this->store_id,
            'name' => $this->name,
            'description' => $this->description,
            'image' => $this->image ? Storage::disk('public')->url($this->image) : null,
            'price' => $this->price,
            'charge_type' => $this->charge_type,
            'active' => $this->active,
            'inventory_quantity' => $this->inventory?->quantity ?? 0,
            'category_service' => $this->whenLoaded('categoryService', function () {
                return [
                    'id' => $this->categoryService->id,
                    'name' => $this->categoryService->name,
                    'slug' => $this->categoryService->slug,
                    'sort_order' => $this->categoryService->sort_order,
                ];
            }),
        ];
    }
}
