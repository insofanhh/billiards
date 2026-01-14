<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use App\Settings\GeneralSettings;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;

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

        try {
            if (Schema::hasTable('settings')) {
                $settings = app(GeneralSettings::class);

                if ($settings->mail_host) {
                    Config::set('mail.mailers.smtp.host', $settings->mail_host);
                }
                if ($settings->mail_port) {
                    Config::set('mail.mailers.smtp.port', $settings->mail_port);
                }
                if ($settings->mail_username) {
                    Config::set('mail.mailers.smtp.username', $settings->mail_username);
                }
                if ($settings->mail_password) {
                    Config::set('mail.mailers.smtp.password', $settings->mail_password);
                }
                if ($settings->mail_from_address) {
                    Config::set('mail.from.address', $settings->mail_from_address);
                }
                if ($settings->mail_from_name) {
                    Config::set('mail.from.name', $settings->mail_from_name);
                }
            }
        } catch (\Throwable $e) {
            // Settings table likely doesn't exist yet or DB connection failed
        }
    }
}
