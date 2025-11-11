<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DebugAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if (env('APP_ENV') === 'production' && $request->is('api/*')) {
            \Log::info('API Request Debug', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'headers' => [
                    'authorization' => $request->header('Authorization'),
                    'origin' => $request->header('Origin'),
                    'referer' => $request->header('Referer'),
                ],
                'user_id' => auth('sanctum')->id(),
                'is_authenticated' => auth('sanctum')->check(),
            ]);
        }

        if (env('APP_ENV') === 'production' && $request->is('broadcasting/auth*')) {
            \Log::info('Broadcasting Auth Debug', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'headers' => [
                    'authorization' => $request->header('Authorization'),
                    'origin' => $request->header('Origin'),
                ],
                'user_id' => auth('sanctum')->id(),
                'is_authenticated' => auth('sanctum')->check(),
                'channel_name' => $request->input('channel_name'),
            ]);
        }

        return $next($request);
    }
}
