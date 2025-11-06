<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\TableType;
use Illuminate\Auth\Access\HandlesAuthorization;

class TableTypePolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:TableType');
    }

    public function view(AuthUser $authUser, TableType $tableType): bool
    {
        return $authUser->can('View:TableType');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:TableType');
    }

    public function update(AuthUser $authUser, TableType $tableType): bool
    {
        return $authUser->can('Update:TableType');
    }

    public function delete(AuthUser $authUser, TableType $tableType): bool
    {
        return $authUser->can('Delete:TableType');
    }

    public function restore(AuthUser $authUser, TableType $tableType): bool
    {
        return $authUser->can('Restore:TableType');
    }

    public function login(AuthUser $authUser): bool
    {
        return $authUser->can('Login:TableType');
    }

}