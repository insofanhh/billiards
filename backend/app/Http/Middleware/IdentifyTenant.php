<?php

namespace App\Http\Middleware;

use App\Models\Store;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->header('X-Store-Slug');

        if (!$slug) {
            // Also check query param for convenience during dev or specific routes
            $slug = $request->query('store_slug');
        }

        if ($slug) {
            $store = Store::where('slug', $slug)->first();
            
            if ($store) {
                // Bind to container
                app()->instance('currentStore', $store);
                app()->instance('currentStoreId', $store->id);
                
                // Scope settings cache to this store to prevent collision
                config(['settings.cache.prefix' => 'store_' . $store->id]);

                // Scope permission cache to this store
                config(['permission.cache.key' => 'spatie.permission.cache.store_' . $store->id]);
                // Reset permission loader to use new cache key
                app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
            }
        }

        return $next($request);
    }
}
