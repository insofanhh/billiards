<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('comments', 'store_id')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->unsignedBigInteger('store_id')->nullable()->after('id');
                $table->index('store_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('comments', 'store_id')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
                $table->dropColumn('store_id');
            });
        }
    }
};
