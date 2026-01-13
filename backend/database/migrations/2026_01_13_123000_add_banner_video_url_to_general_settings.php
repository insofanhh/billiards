<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('settings')->insertOrIgnore([
            'group' => 'general',
            'name' => 'banner_video_url',
            'payload' => json_encode(null),
            'locked' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('settings')
            ->where('group', 'general')
            ->where('name', 'banner_video_url')
            ->delete();
    }
};
