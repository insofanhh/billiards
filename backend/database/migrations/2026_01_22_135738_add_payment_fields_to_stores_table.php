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
        Schema::table('stores', function (Blueprint $table) {
            $table->string('bank_account')->nullable()->after('slug');
            $table->string('bank_name')->nullable()->after('bank_account');
            $table->string('bank_account_name')->nullable()->after('bank_name');
            $table->text('sepay_api_key')->nullable()->after('bank_account_name');
            $table->string('webhook_token')->unique()->nullable()->after('sepay_api_key');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn([
                'bank_account',
                'bank_name',
                'bank_account_name',
                'sepay_api_key',
                'webhook_token'
            ]);
        });
    }
};
