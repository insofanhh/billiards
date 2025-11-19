<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\CategoryService;
use Illuminate\Auth\Access\HandlesAuthorization;

class CategoryServicePolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:CategoryService');
    }

    public function view(AuthUser $authUser, CategoryService $categoryService): bool
    {
        return $authUser->can('View:CategoryService');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:CategoryService');
    }

    public function update(AuthUser $authUser, CategoryService $categoryService): bool
    {
        return $authUser->can('Update:CategoryService');
    }

    public function delete(AuthUser $authUser, CategoryService $categoryService): bool
    {
        return $authUser->can('Delete:CategoryService');
    }

    public function restore(AuthUser $authUser, CategoryService $categoryService): bool
    {
        return $authUser->can('Restore:CategoryService');
    }

    public function login(AuthUser $authUser): bool
    {
        return $authUser->can('Login:CategoryService');
    }

}