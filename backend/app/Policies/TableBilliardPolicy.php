<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\TableBilliard;
use Illuminate\Auth\Access\HandlesAuthorization;

class TableBilliardPolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:TableBilliard');
    }

    public function view(AuthUser $authUser, TableBilliard $tableBilliard): bool
    {
        return $authUser->can('View:TableBilliard');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:TableBilliard');
    }

    public function update(AuthUser $authUser, TableBilliard $tableBilliard): bool
    {
        return $authUser->can('Update:TableBilliard');
    }

    public function delete(AuthUser $authUser, TableBilliard $tableBilliard): bool
    {
        return $authUser->can('Delete:TableBilliard');
    }

    public function restore(AuthUser $authUser, TableBilliard $tableBilliard): bool
    {
        return $authUser->can('Restore:TableBilliard');
    }

    public function login(AuthUser $authUser): bool
    {
        return $authUser->can('Login:TableBilliard');
    }

}