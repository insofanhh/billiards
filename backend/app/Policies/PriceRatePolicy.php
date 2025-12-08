<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\PriceRate;
use Illuminate\Auth\Access\HandlesAuthorization;

class PriceRatePolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:PriceRate');
    }

    public function view(AuthUser $authUser, PriceRate $priceRate): bool
    {
        return $authUser->can('View:PriceRate');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:PriceRate');
    }

    public function update(AuthUser $authUser, PriceRate $priceRate): bool
    {
        return $authUser->can('Update:PriceRate');
    }

    public function delete(AuthUser $authUser, PriceRate $priceRate): bool
    {
        return $authUser->can('Delete:PriceRate');
    }

    public function restore(AuthUser $authUser, PriceRate $priceRate): bool
    {
        return $authUser->can('Restore:PriceRate');
    }

    public function login(AuthUser $authUser): bool
    {
        return $authUser->can('Login:PriceRate');
    }

}