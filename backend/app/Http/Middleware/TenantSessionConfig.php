<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class TenantSessionConfig
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if we are in the admin panel path
        // Pattern: /admin/{tenant_slug}/...
        $path = $request->path();
        
        if (Str::startsWith($path, 'admin/')) {
            $segments = explode('/', $path);
            
            // admin is index 0, slug is index 1
            if (isset($segments[1]) && !empty($segments[1])) {
                $tenantSlug = $segments[1];
                
                // IGNORE system routes if any (e.g. admin/login might not have slug if it was global, 
                // but in this app tenant is part of path: admin/{tenant}/login)
                // We assume the second segment IS the tenant slug.
                
                $cookieName = Str::slug(env('APP_NAME', 'laravel')) . '_session_' . $tenantSlug;
                
                config([
                    'session.cookie' => $cookieName,
                    // Optional: Restrict cookie path to this tenant's area to be extra safe
                    // 'session.path' => "/admin/$tenantSlug", 
                ]);
            }
        }

        return $next($request);
    }
}
