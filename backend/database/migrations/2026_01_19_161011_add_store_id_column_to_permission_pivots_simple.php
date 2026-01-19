<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add store_id to model_has_roles if not exists
        if (!Schema::hasColumn('model_has_roles', 'store_id')) {
            Schema::table('model_has_roles', function (Blueprint $table) {
                $table->unsignedBigInteger('store_id')->nullable();
                $table->index('store_id');
            });
        }

        // Add store_id to model_has_permissions if not exists
        if (!Schema::hasColumn('model_has_permissions', 'store_id')) {
            Schema::table('model_has_permissions', function (Blueprint $table) {
                $table->unsignedBigInteger('store_id')->nullable();
                $table->index('store_id');
            });
        }

        // Update existing records
        DB::statement("
            UPDATE model_has_roles mhr
            JOIN users u ON u.id = mhr.model_id AND mhr.model_type = 'App\\\\Models\\\\User'
            SET mhr.store_id = u.store_id
            WHERE u.store_id IS NOT NULL
        ");

        DB::statement("
            UPDATE model_has_permissions mhp
            JOIN users u ON u.id = mhp.model_id AND mhp.model_type = 'App\\\\Models\\\\User'
            SET mhp.store_id = u.store_id
            WHERE u.store_id IS NOT NULL
        ");
    }

    public function down(): void
    {
        if (Schema::hasColumn('model_has_roles', 'store_id')) {
            Schema::table('model_has_roles', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
                $table->dropColumn('store_id');
            });
        }

        if (Schema::hasColumn('model_has_permissions', 'store_id')) {
            Schema::table('model_has_permissions', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
                $table->dropColumn('store_id');
            });
        }
    }
};
