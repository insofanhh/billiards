<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\Service;
use Illuminate\Auth\Access\HandlesAuthorization;

class ServicePolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:Service');
    }

    public function view(AuthUser $authUser, Service $service): bool
    {
        return $authUser->can('View:Service');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:Service');
    }

    public function update(AuthUser $authUser, Service $service): bool
    {
        return $authUser->can('Update:Service');
    }

    public function delete(AuthUser $authUser, Service $service): bool
    {
        return $authUser->can('Delete:Service');
    }

    public function restore(AuthUser $authUser, Service $service): bool
    {
        return $authUser->can('Restore:Service');
    }

    public function login(AuthUser $authUser): bool
    {
        return $authUser->can('Login:Service');
    }

}