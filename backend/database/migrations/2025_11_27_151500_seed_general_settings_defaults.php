<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Seed default rows required by Spatie settings for the general group.
     */
    public function up(): void
    {
        $defaults = [
            'image_banner' => [],
            'is_notification_active' => false,
            'notification_content' => null,
            'extra_notifications' => [],
        ];

        foreach ($defaults as $name => $value) {
            DB::table('settings')->updateOrInsert(
                ['group' => 'general', 'name' => $name],
                [
                    'payload' => json_encode($value),
                    'locked' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }
    }

    /**
     * Remove the seeded rows.
     */
    public function down(): void
    {
        DB::table('settings')
            ->where('group', 'general')
            ->whereIn('name', [
                'image_banner',
                'is_notification_active',
                'notification_content',
                'extra_notifications',
            ])
            ->delete();
    }
};

