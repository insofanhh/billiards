<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\Comment;
use Illuminate\Auth\Access\HandlesAuthorization;

class CommentPolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:Comment');
    }

    public function view(AuthUser $authUser, Comment $comment): bool
    {
        return $authUser->can('View:Comment');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:Comment');
    }

    public function update(AuthUser $authUser, Comment $comment): bool
    {
        return $authUser->can('Update:Comment');
    }

    public function delete(AuthUser $authUser, Comment $comment): bool
    {
        return $authUser->can('Delete:Comment');
    }

    public function restore(AuthUser $authUser, Comment $comment): bool
    {
        return $authUser->can('Restore:Comment');
    }

    public function login(AuthUser $authUser): bool
    {
        return $authUser->can('Login:Comment');
    }

}