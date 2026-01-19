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
            }
        }

        return $next($request);
    }
}
