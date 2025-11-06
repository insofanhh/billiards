<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('user.{userId}', function ($user, $userId) {
    if (!$user) {
        \Log::info('Broadcast channel user.{userId} - No user authenticated', ['userId' => $userId]);
        return false;
    }
    $result = (int) $user->id === (int) $userId;
    \Log::info('Broadcast channel user.{userId} authorization', [
        'user_id' => $user->id,
        'requested_userId' => $userId,
        'authorized' => $result
    ]);
    return $result;
});

Broadcast::channel('staff', function ($user) {
    if (!$user) {
        \Log::info('Broadcast channel staff - No user authenticated');
        return false;
    }
    try {
        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin','staff'])) {
            \Log::info('Broadcast channel staff - Authorized by role', ['user_id' => $user->id]);
            return true;
        }
    } catch (\Throwable $e) {
        \Log::warning('Broadcast channel staff - Role check error', ['error' => $e->getMessage()]);
    }
    try {
        if (method_exists($user, 'hasPermissionTo') && ($user->hasPermissionTo('login') || $user->hasPermissionTo('Login'))) {
            \Log::info('Broadcast channel staff - Authorized by permission', ['user_id' => $user->id]);
            return true;
        }
    } catch (\Throwable $e) {
        \Log::warning('Broadcast channel staff - Permission check error', ['error' => $e->getMessage()]);
    }
    \Log::info('Broadcast channel staff - Not authorized', ['user_id' => $user->id]);
    return false;
});

Broadcast::channel('orders', function ($user) {
    return $user !== null;
});
