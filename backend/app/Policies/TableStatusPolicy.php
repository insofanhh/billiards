<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\TableStatus;
use Illuminate\Auth\Access\HandlesAuthorization;

class TableStatusPolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:TableStatus');
    }

    public function view(AuthUser $authUser, TableStatus $tableStatus): bool
    {
        return $authUser->can('View:TableStatus');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:TableStatus');
    }

    public function update(AuthUser $authUser, TableStatus $tableStatus): bool
    {
        return $authUser->can('Update:TableStatus');
    }

    public function delete(AuthUser $authUser, TableStatus $tableStatus): bool
    {
        return $authUser->can('Delete:TableStatus');
    }

    public function restore(AuthUser $authUser, TableStatus $tableStatus): bool
    {
        return $authUser->can('Restore:TableStatus');
    }

    public function login(AuthUser $authUser): bool
    {
        return $authUser->can('Login:TableStatus');
    }

}