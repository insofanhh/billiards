<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('stores', 'bank_account') && !Schema::hasColumn('stores', 'bank_account_no')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->renameColumn('bank_account', 'bank_account_no');
            });
        } elseif (!Schema::hasColumn('stores', 'bank_account_no')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->string('bank_account_no')->nullable()->after('slug');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('stores', 'bank_account_no')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->renameColumn('bank_account_no', 'bank_account');
            });
        }
    }
};
