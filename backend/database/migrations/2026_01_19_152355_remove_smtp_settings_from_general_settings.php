<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $smtpSettings = [
            'mail_host',
            'mail_port',
            'mail_username',
            'mail_password',
            'mail_from_address',
            'mail_from_name',
        ];

        DB::table('settings')
            ->where('group', 'general')
            ->whereIn('name', $smtpSettings)
            ->delete();
    }

    public function down(): void
    {
        $smtpSettings = [
            'mail_host',
            'mail_port',
            'mail_username',
            'mail_password',
            'mail_from_address',
            'mail_from_name',
        ];

        foreach ($smtpSettings as $name) {
            DB::table('settings')->insertOrIgnore([
                'group' => 'general',
                'name' => $name,
                'payload' => json_encode(null),
                'locked' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
};
