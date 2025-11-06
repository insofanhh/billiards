<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\OrderItem;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrderItemPolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:OrderItem');
    }

    public function view(AuthUser $authUser, OrderItem $orderItem): bool
    {
        return $authUser->can('View:OrderItem');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:OrderItem');
    }

    public function update(AuthUser $authUser, OrderItem $orderItem): bool
    {
        return $authUser->can('Update:OrderItem');
    }

    public function delete(AuthUser $authUser, OrderItem $orderItem): bool
    {
        return $authUser->can('Delete:OrderItem');
    }

    public function restore(AuthUser $authUser, OrderItem $orderItem): bool
    {
        return $authUser->can('Restore:OrderItem');
    }

    public function login(AuthUser $authUser): bool
    {
        return $authUser->can('Login:OrderItem');
    }

}