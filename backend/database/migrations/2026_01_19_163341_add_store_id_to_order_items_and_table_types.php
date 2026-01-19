<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add store_id to order_items
        if (!Schema::hasColumn('order_items', 'store_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->unsignedBigInteger('store_id')->nullable()->after('id');
                $table->index('store_id');
            });

            // Update store_id from orders table
            DB::statement("
                UPDATE order_items oi
                JOIN orders o ON o.id = oi.order_id
                SET oi.store_id = o.store_id
                WHERE o.store_id IS NOT NULL
            ");
        }

        // Add store_id to table_types
        if (!Schema::hasColumn('table_types', 'store_id')) {
            Schema::table('table_types', function (Blueprint $table) {
                $table->unsignedBigInteger('store_id')->nullable()->after('id');
                $table->index('store_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('order_items', 'store_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
                $table->dropColumn('store_id');
            });
        }

        if (Schema::hasColumn('table_types', 'store_id')) {
            Schema::table('table_types', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
                $table->dropColumn('store_id');
            });
        }
    }
};
