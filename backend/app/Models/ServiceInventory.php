<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToTenant;

class ServiceInventory extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'store_id',
        'service_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
