<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class GeneralSettings extends Settings
{
    /**
     * Store banner images for the client landing page.
     */
    public ?array $image_banner;
    
    public ?string $banner_video_url;

    /**
     * Determine whether system-wide notifications are enabled.
     */
    public bool $is_notification_active;

    /**
     * Main notification content displayed to end users.
     */
    public ?string $notification_content;

    /**
     * Additional notification entries (title + link pairs).
     */
    public array $extra_notifications;
    
    public ?string $daily_report_email;

    public ?string $mail_host;
    public ?string $mail_port;
    public ?string $mail_username;
    public ?string $mail_password;
    public ?string $mail_from_address;
    public ?string $mail_from_name;

    public static function group(): string
    {
        return 'general';
    }

    /**
     * Provide default values for the settings payload.
     *
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'image_banner' => [],
            'banner_video_url' => null,
            'is_notification_active' => false,
            'notification_content' => null,
            'notification_content' => null,
            'extra_notifications' => [],
            'daily_report_email' => null,
            'mail_host' => null,
            'mail_port' => null,
            'mail_username' => null,
            'mail_password' => null,
            'mail_from_address' => null,
            'mail_from_name' => null,
        ];
    }
}

