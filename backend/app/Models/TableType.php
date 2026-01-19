<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\BelongsToTenant;

class TableType extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'store_id',
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
