<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleCors
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');
        
        $allowedOrigins = array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'))));
        
        if (empty($allowedOrigins)) {
            $allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
        }
        
        $allowOrigin = $origin && in_array($origin, $allowedOrigins) ? $origin : null;
        
        if (!$allowOrigin) {
            if (env('APP_ENV') === 'local') {
                $allowOrigin = $origin ?: '*';
            } else {
                $allowOrigin = $allowedOrigins[0] ?? '*';
            }
        }

        if ($request->isMethod('OPTIONS')) {
            $response = response('', 200);
            if ($allowOrigin) {
                $response->header('Access-Control-Allow-Origin', $allowOrigin)
                    ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-CSRF-TOKEN')
                    ->header('Access-Control-Allow-Credentials', 'true')
                    ->header('Access-Control-Max-Age', '86400');
            }
            return $response;
        }

        $response = $next($request);

        if (($request->is('broadcasting/auth') || $request->is('broadcasting/auth*') || $request->is('api/*')) && $allowOrigin) {
            $response->headers->set('Access-Control-Allow-Origin', $allowOrigin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-CSRF-TOKEN');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }
}

