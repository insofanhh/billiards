<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('stores', 'bank_account')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->string('bank_account')->nullable()->after('slug');
            });
        }

        if (!Schema::hasColumn('stores', 'bank_name')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->string('bank_name')->nullable()->after('bank_account');
            });
        }

        if (!Schema::hasColumn('stores', 'bank_account_name')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->string('bank_account_name')->nullable()->after('bank_name');
            });
        }

        if (!Schema::hasColumn('stores', 'sepay_api_key')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->text('sepay_api_key')->nullable()->after('bank_account_name');
            });
        }

        if (!Schema::hasColumn('stores', 'webhook_token')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->string('webhook_token')->unique()->nullable()->after('sepay_api_key');
            });
        }
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            if (Schema::hasColumn('stores', 'bank_account')) {
                $table->dropColumn('bank_account');
            }
            if (Schema::hasColumn('stores', 'bank_name')) {
                $table->dropColumn('bank_name');
            }
            if (Schema::hasColumn('stores', 'bank_account_name')) {
                $table->dropColumn('bank_account_name');
            }
            if (Schema::hasColumn('stores', 'sepay_api_key')) {
                $table->dropColumn('sepay_api_key');
            }
            if (Schema::hasColumn('stores', 'webhook_token')) {
                $table->dropColumn('webhook_token');
            }
        });
    }
};
