<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use App\Settings\GeneralSettings;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Event;
use App\Listeners\SaveStoreNotification;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Event::subscribe(SaveStoreNotification::class);

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
    }
}
