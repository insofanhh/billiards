<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\Order;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrderPolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:Order');
    }

    public function view(AuthUser $authUser, Order $order): bool
    {
        return $authUser->can('View:Order');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:Order');
    }

    public function update(AuthUser $authUser, Order $order): bool
    {
        return $authUser->can('Update:Order');
    }

    public function delete(AuthUser $authUser, Order $order): bool
    {
        return $authUser->can('Delete:Order');
    }

    public function restore(AuthUser $authUser, Order $order): bool
    {
        return $authUser->can('Restore:Order');
    }

    public function login(AuthUser $authUser): bool
    {
        return $authUser->can('Login:Order');
    }

}