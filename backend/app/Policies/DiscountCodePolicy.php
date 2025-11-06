<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\DiscountCode;
use Illuminate\Auth\Access\HandlesAuthorization;

class DiscountCodePolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:DiscountCode');
    }

    public function view(AuthUser $authUser, DiscountCode $discountCode): bool
    {
        return $authUser->can('View:DiscountCode');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:DiscountCode');
    }

    public function update(AuthUser $authUser, DiscountCode $discountCode): bool
    {
        return $authUser->can('Update:DiscountCode');
    }

    public function delete(AuthUser $authUser, DiscountCode $discountCode): bool
    {
        return $authUser->can('Delete:DiscountCode');
    }

    public function restore(AuthUser $authUser, DiscountCode $discountCode): bool
    {
        return $authUser->can('Restore:DiscountCode');
    }

    public function login(AuthUser $authUser): bool
    {
        return $authUser->can('Login:DiscountCode');
    }

}