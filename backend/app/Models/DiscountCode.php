<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use App\Traits\BelongsToTenant;

class DiscountCode extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'store_id',
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
        'public_discount',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'min_spend' => 'decimal:2',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'active' => 'boolean',
        'public_discount' => 'boolean',
    ];

    protected static function booted()
    {
        static::updating(function ($discount) {
            // Khi admin tắt public_discount, xóa tất cả saved records để reset trạng thái
            if ($discount->isDirty('public_discount') && $discount->public_discount === false) {
                DB::table('user_saved_discounts')
                    ->where('discount_code_id', $discount->id)
                    ->delete();
            }
        });
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'applied_discount_id');
    }

    public function savedByUsers()
    {
        return $this->belongsToMany(User::class, 'user_saved_discounts')
            ->withTimestamps();
    }
}
