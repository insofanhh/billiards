<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('service_inventories', 'store_id')) {
            Schema::table('service_inventories', function (Blueprint $table) {
                $table->unsignedBigInteger('store_id')->nullable()->after('id');
                $table->index('store_id');
            });

            // Update store_id from services table
            DB::statement("
                UPDATE service_inventories si
                JOIN services s ON s.id = si.service_id
                SET si.store_id = s.store_id
                WHERE s.store_id IS NOT NULL
            ");
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('service_inventories', 'store_id')) {
            Schema::table('service_inventories', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
                $table->dropColumn('store_id');
            });
        }
    }
};
