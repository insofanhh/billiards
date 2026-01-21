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
            
            // Assuming URL structure: /admin/{slug}
            if ($path && \Illuminate\Support\Str::contains($path, '/admin/')) {
                $segments = explode('/', trim($path, '/'));
                // admin is likely index 0, slug index 1
                $adminIndex = array_search('admin', $segments);
                
                if ($adminIndex !== false && isset($segments[$adminIndex + 1])) {
                    $slug = $segments[$adminIndex + 1];
                    $tenant = \App\Models\Store::where('slug', $slug)->first();
                }
            }
        }

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
