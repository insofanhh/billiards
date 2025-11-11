<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class HandleCors
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');
        $appUrl = env('APP_URL', 'http://localhost:8000');
        
        $allowedOrigins = array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', ''))));
        
        $isSameOrigin = $origin && parse_url($origin, PHP_URL_HOST) === parse_url($appUrl, PHP_URL_HOST);
        
        if (empty($allowedOrigins) && env('APP_ENV') !== 'production') {
            $allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
        }
        
        // Debug log cho production
        if (env('APP_ENV') === 'production') {
            Log::info('CORS Debug', [
                'origin' => $origin,
                'allowedOrigins' => $allowedOrigins,
                'isSameOrigin' => $isSameOrigin,
                'appUrl' => $appUrl
            ]);
        }
        
        $allowOrigin = null;
        if ($isSameOrigin) {
            $allowOrigin = $origin;
        } elseif ($origin && !empty($allowedOrigins) && in_array($origin, $allowedOrigins)) {
            $allowOrigin = $origin;
        } elseif (env('APP_ENV') === 'local') {
            $allowOrigin = $origin ?: '*';
        } elseif (!empty($allowedOrigins)) {
            $allowOrigin = $allowedOrigins[0];
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

