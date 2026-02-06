<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformTransaction extends Model
{
    protected $fillable = [
        'store_id',
        'amount',
        'months',
        'status',
        'transaction_code',
        'content',
        'description',
        'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class);
    }
}
