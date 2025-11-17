<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Service extends Model
{
    protected $fillable = [
        'name',
        'description',
        'image',
        'price',
        'charge_type',
        'active',
        'category_service_id',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? Storage::disk('public')->url($this->image) : null;
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function categoryService(): BelongsTo
    {
        return $this->belongsTo(CategoryService::class);
    }
}
