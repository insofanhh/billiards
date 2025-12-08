<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('user.{userId}', function ($user, $userId) {
    if (!$user) {
        return false;
    }
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('staff', function ($user) {
    if (!$user) {
        return false;
    }
    
    $user->load('roles');
    
    $roles = $user->roles->pluck('name')->toArray();
    $isStaff = in_array('staff', $roles) || 
               in_array('admin', $roles) || 
               in_array('super_admin', $roles);
    
    if ($isStaff) {
        return true;
    }
    
    try {
        if (method_exists($user, 'hasAnyRole')) {
            if ($user->hasAnyRole(['admin', 'staff', 'super_admin'])) {
                return true;
            }
        }
    } catch (\Throwable $e) {
        Log::warning('Broadcast channel staff - Role check error', [
            'error' => $e->getMessage(),
            'user_id' => $user->id
        ]);
    }
    
    return false;
});

Broadcast::channel('orders', function ($user) {
    return $user !== null;
});
