<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

class MergedTableFee extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'store_id',
        'order_id',
        'table_name',
        'start_at',
        'end_at',
        'total_price'
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
