<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TableType extends Model
{
    protected $fillable = [
        'name',
        'description',
    ];

    public function tables(): HasMany
    {
        return $this->hasMany(TableBilliard::class, 'table_type_id');
    }

    public function priceRates(): HasMany
    {
        return $this->hasMany(PriceRate::class, 'table_type_id');
    }
}
