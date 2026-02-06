<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckStoreExpiration
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = \Filament\Facades\Filament::getTenant();

        if ($tenant && ($tenant->expires_at && $tenant->expires_at->isPast())) {
             // Allow access to logout or specific allowed routes if needed, 
             // but generally we want to block everything except maybe logout.
             // Filament handles logout via post to /logout usually.
             
             // Check if it's an API request or regular request to decide on response
             if ($request->wantsJson()) {
                 return response()->json(['message' => 'Store subscription expired.'], 403);
             }

             // Redirect to frontend extension page
             return redirect()->away("/s/{$tenant->slug}/extend");
        }

        return $next($request);
    }
}
