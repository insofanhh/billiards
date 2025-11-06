<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PriceRate extends Model
{
    protected $fillable = [
        'table_type_id',
        'price_per_hour',
        'active',
    ];

    protected $casts = [
        'price_per_hour' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function tableType(): BelongsTo
    {
        return $this->belongsTo(TableType::class, 'table_type_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'price_rate_id');
    }
}
