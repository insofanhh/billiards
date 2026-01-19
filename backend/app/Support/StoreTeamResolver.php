<?php

namespace App\Support;

use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Contracts\PermissionsTeamResolver;

class StoreTeamResolver implements PermissionsTeamResolver
{
    protected string|int|null $teamId = null;

    public function getPermissionsTeamId(): string|int|null
    {
        if ($this->teamId !== null) {
            return $this->teamId;
        }

        if (app()->has('currentStoreId')) {
            return app('currentStoreId');
        }

        $user = Auth::user();
        if ($user && $user->store_id) {
            return $user->store_id;
        }

        return null;
    }

    public function setPermissionsTeamId($id): void
    {
        $this->teamId = $id;
    }
}
