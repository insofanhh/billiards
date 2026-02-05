<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['prefix' => 'api', 'middleware' => ['api', 'auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \App\Http\Middleware\EnsureApiKey::class,
            \App\Http\Middleware\HandleCors::class,
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \App\Http\Middleware\PrioritizeSanctumToken::class,
            \App\Http\Middleware\DebugAuth::class,
            \App\Http\Middleware\IdentifyTenant::class,
        ]);

        $middleware->alias([
            'platform.admin' => \App\Http\Middleware\CheckPlatformAdmin::class,
            'api.key' => \App\Http\Middleware\EnsureApiKey::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'broadcasting/auth',
            'broadcasting/auth*',
            'api/*',
            'api/tables/*/request-open',
            'api/sepay/webhook',
        ]);

        $middleware->web(prepend: [
            \App\Http\Middleware\HandleCors::class,
        ]);

        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*')) {
                $message = $e->getMessage();
                if (
                    $e instanceof \Illuminate\Database\QueryException ||
                    $e instanceof \PDOException ||
                    str_contains($message, 'Connection refused') ||
                    str_contains($message, 'SQLSTATE[HY000]') ||
                    str_contains($message, 'No connection could be made')
                ) {
                    return response()->json([
                        'message' => 'Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.',
                        'error' => 'Database connection failed'
                    ], 503);
                }
            }
        });
    })->create();
