<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToTenant;

class ServiceInventory extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'store_id',
        'service_id',
        'quantity',
        'average_cost',
        'last_restock_date',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'average_cost' => 'decimal:2',
        'last_restock_date' => 'datetime',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'service_id', 'service_id');
    }
}
