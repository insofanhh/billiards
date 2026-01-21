<?php

namespace App\Http\Middleware;

use Closure;
use Filament\Facades\Filament;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SyncFilamentTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Filament::getTenant();

        if ($tenant) {
            app()->instance('currentStore', $tenant);
            app()->instance('currentStoreId', $tenant->id);

            // Scope settings cache to this store to prevent collision
            config(['settings.cache.prefix' => 'store_' . $tenant->id]);

            // Scope permission cache to this store
            config(['permission.cache.key' => 'spatie.permission.cache.store_' . $tenant->id]);
            // Reset permission loader to use new cache key
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        }

        return $next($request);
    }
}
