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

        // Fallback: If no tenant resolved (e.g., Livewire update), try to resolve from Referer
        if (!$tenant && $request->headers->has('referer')) {
            $referer = $request->headers->get('referer');
            $path = parse_url($referer, PHP_URL_PATH);
            
            // Regex to find /admin/{slug}/...
            if ($path && ctype_alnum(str_replace(['-', '_'], '', 'test'))) { // Check regex safety or just use regex
                if (preg_match('/\/admin\/([^\/]+)/', $path, $matches)) {
                   $slug = $matches[1];
                   $tenant = \App\Models\Store::where('slug', $slug)->first();
                }
            }
        }

        if ($tenant) {
            // Ensure Filament knows about the tenant if we found it manually
            if (!Filament::getTenant()) {
                Filament::setTenant($tenant);
            }

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
