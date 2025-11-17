<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'image' => $this->image ? asset('storage/' . $this->image) : null,
            'price' => $this->price,
            'charge_type' => $this->charge_type,
            'active' => $this->active,
            'category_service' => $this->whenLoaded('categoryService', function () {
                return [
                    'id' => $this->categoryService->id,
                    'name' => $this->categoryService->name,
                    'slug' => $this->categoryService->slug,
                ];
            }),
        ];
    }
}
