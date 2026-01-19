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

        if ($tenant) {
            app()->instance('currentStore', $tenant);
            app()->instance('currentStoreId', $tenant->id);
        }

        return $next($request);
    }
}
