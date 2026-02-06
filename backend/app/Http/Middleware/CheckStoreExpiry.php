<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckStoreExpiry
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->store) {
            $store = $user->store;
            
            // If store is expired or inactive
            if (($store->expires_at && $store->expires_at->isPast()) || !$store->is_active) {
                
                // Allow access to extension-related routes
                // We should define patterns that are allowed.
                // For now, allow public extension routes and maybe logout.
                
                $allowedPatterns = [
                    'api/public/store-extensions/*',
                    'api/auth/logout',
                    'api/auth/sync-token',
                    'api/user', // Needed for frontend initial load
                ];

                foreach ($allowedPatterns as $pattern) {
                    if ($request->is($pattern)) {
                        return $next($request);
                    }
                }

                // If not allowed, return error
                return response()->json([
                    'message' => 'Cửa hàng đã hết hạn dùng thử/đăng ký. Vui lòng gia hạn.',
                    'code' => 'STORE_EXPIRED',
                    'store_slug' => $store->slug
                ], 403);
            }
        }

        return $next($request);
    }
}
