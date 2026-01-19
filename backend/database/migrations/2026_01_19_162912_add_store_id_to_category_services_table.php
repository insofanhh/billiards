<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('category_services', 'store_id')) {
            Schema::table('category_services', function (Blueprint $table) {
                $table->unsignedBigInteger('store_id')->nullable()->after('id');
                $table->index('store_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('category_services', 'store_id')) {
            Schema::table('category_services', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
                $table->dropColumn('store_id');
            });
        }
    }
};
