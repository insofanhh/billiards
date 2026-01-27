<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('setting_platforms', function (Blueprint $table) {
            $table->string('support_messenger')->nullable();
            $table->string('support_hotline')->nullable();
            $table->string('support_youtube')->nullable();
            $table->string('support_telegram')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('setting_platforms', function (Blueprint $table) {
            $table->dropColumn(['support_messenger', 'support_hotline', 'support_youtube', 'support_telegram']);
        });
    }
};
