<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiscountCode extends Model
{
    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'min_spend',
        'usage_limit',
        'used_count',
        'start_at',
        'end_at',
        'active',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'min_spend' => 'decimal:2',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'active' => 'boolean',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'applied_discount_id');
    }
}
