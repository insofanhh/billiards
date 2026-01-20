<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Traits\BelongsToTenant;

class TableStatus extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'store_id',
        'name',
        'description',
        'color',
    ];

    public function tables(): HasMany
    {
        return $this->hasMany(TableBilliard::class, 'status_id');
    }
}
