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
            $table->string('bank_name')->nullable();
            $table->string('bank_account')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->string('sepay_api_key')->nullable();
            $table->string('sepay_webhook_token')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('setting_platforms', function (Blueprint $table) {
            $table->dropColumn([
                'bank_name',
                'bank_account', 
                'bank_account_name',
                'sepay_api_key',
                'sepay_webhook_token'
            ]);
        });
    }
};
