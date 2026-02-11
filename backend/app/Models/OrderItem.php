<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToTenant;

class OrderItem extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'store_id',
        'order_id',
        'service_id',
        'name',
        'qty',
        'unit_price',
        'total_price',
        'is_confirmed',
        'stock_deducted',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'is_confirmed' => 'boolean',
        'stock_deducted' => 'boolean',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function mergedTableFee()
    {
        return $this->hasOne(MergedTableFee::class);
    }

    public function inventoryTransaction(): \Illuminate\Database\Eloquent\Relations\MorphOne
    {
        return $this->morphOne(InventoryTransaction::class, 'reference');
    }
}
