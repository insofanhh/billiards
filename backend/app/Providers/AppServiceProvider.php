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
        // Customize Email Verification URL to point to Frontend
        \Illuminate\Auth\Notifications\VerifyEmail::createUrlUsing(function (object $notifiable) {
            $frontendUrl = config('app.frontend_url', config('app.url'));
            
            $id = $notifiable->getKey();
            $hash = sha1($notifiable->getEmailForVerification());
            
            // Helper to generate temporary signed route for our API endpoint, then extract query
            // We use the backend route to generate the valid signature
            $backendUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(config('auth.verification.expire', 60)),
                ['id' => $id, 'hash' => $hash]
            );
            
            $queryString = parse_url($backendUrl, PHP_URL_QUERY);
            
            return "{$frontendUrl}/verify-email/{$id}/{$hash}?{$queryString}";
        });

        // Customize Email Content
        \Illuminate\Auth\Notifications\VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            return (new \Illuminate\Notifications\Messages\MailMessage)
                ->subject('Xác thực địa chỉ Email - ' . config('app.name'))
                ->greeting('Xin chào!')
                ->line('Cảm ơn bạn đã đăng ký tài khoản tại ' . config('app.name') . '.')
                ->line('Vui lòng bấm vào nút bên dưới để xác thực địa chỉ email của bạn.')
                ->action('Xác thực Email', $url)
                ->line('Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.')
                ->salutation('Trân trọng, ' . config('app.name'));
        });

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
