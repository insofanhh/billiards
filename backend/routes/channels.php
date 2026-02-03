<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('store.{storeId}', function ($user, $storeId) {
    // Check if user belongs to the store
    if ((int) $user->store_id === (int) $storeId) {
        return true;
    }
    
    // Also allow super_admin, admin, and staff roles regardless of store_id
    if ($user->hasRole('super_admin') || $user->hasRole('admin') || $user->hasRole('staff')) {
        return true;
    }

    return false;
});
