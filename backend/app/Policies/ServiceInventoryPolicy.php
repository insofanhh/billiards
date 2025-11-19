<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\ServiceInventory;
use Illuminate\Auth\Access\HandlesAuthorization;

class ServiceInventoryPolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:ServiceInventory');
    }

    public function view(AuthUser $authUser, ServiceInventory $serviceInventory): bool
    {
        return $authUser->can('View:ServiceInventory');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:ServiceInventory');
    }

    public function update(AuthUser $authUser, ServiceInventory $serviceInventory): bool
    {
        return $authUser->can('Update:ServiceInventory');
    }

    public function delete(AuthUser $authUser, ServiceInventory $serviceInventory): bool
    {
        return $authUser->can('Delete:ServiceInventory');
    }

    public function restore(AuthUser $authUser, ServiceInventory $serviceInventory): bool
    {
        return $authUser->can('Restore:ServiceInventory');
    }

    public function login(AuthUser $authUser): bool
    {
        return $authUser->can('Login:ServiceInventory');
    }

}