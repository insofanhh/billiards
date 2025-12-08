<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\OrderStatus;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrderStatusPolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:OrderStatus');
    }

    public function view(AuthUser $authUser, OrderStatus $orderStatus): bool
    {
        return $authUser->can('View:OrderStatus');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:OrderStatus');
    }

    public function update(AuthUser $authUser, OrderStatus $orderStatus): bool
    {
        return $authUser->can('Update:OrderStatus');
    }

    public function delete(AuthUser $authUser, OrderStatus $orderStatus): bool
    {
        return $authUser->can('Delete:OrderStatus');
    }

    public function restore(AuthUser $authUser, OrderStatus $orderStatus): bool
    {
        return $authUser->can('Restore:OrderStatus');
    }

    public function login(AuthUser $authUser): bool
    {
        return $authUser->can('Login:OrderStatus');
    }

}