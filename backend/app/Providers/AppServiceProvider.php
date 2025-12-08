<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $directories = [
            'services',
        ];

        foreach ($directories as $directory) {
            $path = storage_path('app/public/' . $directory);
            if (!file_exists($path)) {
                Storage::disk('public')->makeDirectory($directory);
            }
        }

        if (env('APP_ENV') === 'production') {
            URL::forceScheme('https');
        }

        \Illuminate\Support\Facades\Event::listen(
            \SePay\SePay\Events\SePayWebhookEvent::class,
            \App\Listeners\SePayWebhookListener::class,
        );
    }
}
