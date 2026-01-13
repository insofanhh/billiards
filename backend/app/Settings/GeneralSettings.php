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
            'extra_notifications' => [],
        ];
    }
}

