<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TableStatus extends Model
{
    protected $fillable = [
        'name',
        'description',
        'color',
    ];

    public function tables(): HasMany
    {
        return $this->hasMany(TableBilliard::class, 'status_id');
    }
}
