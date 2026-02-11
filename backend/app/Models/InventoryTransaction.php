<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InventoryTransaction extends Model
{
    protected $fillable = [
        'service_id',
        'user_id',
        'type',
        'quantity_change',
        'new_quantity_snapshot',
        'unit_cost',
        'reference_type',
        'reference_id',
        'note',
    ];

    protected $casts = [
        'quantity_change' => 'integer',
        'new_quantity_snapshot' => 'integer',
        'unit_cost' => 'decimal:2',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}
