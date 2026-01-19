<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\BelongsToTenant;

class Order extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'store_id',
        'order_code',
        'user_id',
        'table_id',
        'price_rate_id',
        'admin_confirmed_by',
        'start_at',
        'end_at',
        'status',
        'applied_discount_id',
        'order_status_id',
        'total_play_time_minutes',
        'total_before_discount',
        'total_discount',
        'total_paid',
        'notes',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'total_before_discount' => 'decimal:2',
        'total_discount' => 'decimal:2',
        'total_paid' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(TableBilliard::class, 'table_id');
    }

    public function priceRate(): BelongsTo
    {
        return $this->belongsTo(PriceRate::class, 'price_rate_id');
    }

    public function adminConfirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_confirmed_by');
    }

    public function appliedDiscount(): BelongsTo
    {
        return $this->belongsTo(DiscountCode::class, 'applied_discount_id');
    }

    public function orderStatus(): BelongsTo
    {
        return $this->belongsTo(OrderStatus::class, 'order_status_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function review(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
