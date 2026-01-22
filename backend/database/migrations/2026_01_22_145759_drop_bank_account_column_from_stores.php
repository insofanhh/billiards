<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('stores', 'bank_account')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->dropColumn('bank_account');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('stores', 'bank_account')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->string('bank_account')->nullable()->after('slug');
            });
        }
    }
};
