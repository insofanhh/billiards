<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TableBilliard extends Model
{
    protected $table = 'tables_billiards';

    protected $fillable = [
        'code',
        'name',
        'seats',
        'qr_code',
        'location',
        'status_id',
        'table_type_id',
    ];

    public function status(): BelongsTo
    {
        return $this->belongsTo(TableStatus::class, 'status_id');
    }

    public function tableType(): BelongsTo
    {
        return $this->belongsTo(TableType::class, 'table_type_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }
}
