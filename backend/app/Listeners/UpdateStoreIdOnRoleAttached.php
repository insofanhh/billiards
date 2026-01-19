<?php

namespace App\Listeners;

use Illuminate\Support\Facades\DB;
use Spatie\Permission\Events\RoleAttached;

class UpdateStoreIdOnRoleAttached
{
    public function handle(RoleAttached $event): void
    {
        $model = $event->model;
        $role = $event->role;
        
        // Only process for User models with store_id
        if (!$model instanceof \App\Models\User || !$model->store_id) {
            return;
        }

        // Update store_id in pivot table
        DB::table('model_has_roles')
            ->where('model_id', $model->id)
            ->where('model_type', get_class($model))
            ->where('role_id', $role->id)
            ->update(['store_id' => $model->store_id]);
    }
}
