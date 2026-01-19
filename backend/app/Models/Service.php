<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;
use App\Traits\BelongsToTenant;

class Service extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'store_id',
        'name',
        'description',
        'image',
        'price',
        'charge_type',
        'active',
        'category_service_id',
    ];

    protected $with = ['inventory'];

    protected $casts = [
        'price' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function getImageUrlAttribute(): ?string
    {
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $this->image ? $disk->url($this->image) : null;
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function categoryService(): BelongsTo
    {
        return $this->belongsTo(CategoryService::class);
    }

    public function inventory(): HasOne
    {
        return $this->hasOne(ServiceInventory::class);
    }

    public function getAvailableQuantityAttribute(): int
    {
        return $this->inventory?->quantity ?? 0;
    }

    protected static function booted(): void
    {
        static::created(function (Service $service) {
            if (!$service->inventory()->exists()) {
                $service->inventory()->create(['quantity' => 0]);
            }
        });
    }
}
