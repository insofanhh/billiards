<?php

namespace App\Traits;

use App\Models\Store;
use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant()
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function ($model) {
            if (!$model->store_id && app()->has('currentStoreId')) {
                $model->store_id = app('currentStoreId');
            }
        });
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
