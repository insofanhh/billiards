<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PrioritizeSanctumToken
{
    /**
     * Nếu request có Bearer token thì bỏ qua guard session của Sanctum
     * để đảm bảo xác thực đúng theo token thay vì cookie còn tồn tại.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): \Symfony\Component\HttpFoundation\Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken()) {
            config(['sanctum.guard' => []]);
        }

        return $next($request);
    }
}

