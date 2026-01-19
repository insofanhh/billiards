<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add store_id to model_has_roles
        Schema::table('model_has_roles', function (Blueprint $table) {
            if (!Schema::hasColumn('model_has_roles', 'store_id')) {
                // Drop old primary key
                $table->dropPrimary('model_has_roles_role_model_type_primary');
                
                // Add store_id column
                $table->unsignedBigInteger('store_id')->nullable()->after('role_id');
                $table->index('store_id', 'model_has_roles_store_id_index');
            }
        });

        // Update existing records to populate store_id from users table
        DB::statement("
            UPDATE model_has_roles mhr
            JOIN users u ON u.id = mhr.model_id AND mhr.model_type = 'App\\\\Models\\\\User'
            SET mhr.store_id = u.store_id
            WHERE u.store_id IS NOT NULL
        ");

        // Add new primary key including store_id
        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->primary(
                ['store_id', 'role_id', 'model_id', 'model_type'],
                'model_has_roles_role_model_type_primary'
            );
        });

        // Add store_id to model_has_permissions
        Schema::table('model_has_permissions', function (Blueprint $table) {
            if (!Schema::hasColumn('model_has_permissions', 'store_id')) {
                // Drop old primary key
                $table->dropPrimary('model_has_permissions_permission_model_type_primary');
                
                // Add store_id column
                $table->unsignedBigInteger('store_id')->nullable()->after('permission_id');
                $table->index('store_id', 'model_has_permissions_store_id_index');
            }
        });

        // Update existing records
        DB::statement("
            UPDATE model_has_permissions mhp
            JOIN users u ON u.id = mhp.model_id AND mhp.model_type = 'App\\\\Models\\\\User'
            SET mhp.store_id = u.store_id
            WHERE u.store_id IS NOT NULL
        ");

        // Add new primary key including store_id
        Schema::table('model_has_permissions', function (Blueprint $table) {
            $table->primary(
                ['store_id', 'permission_id', 'model_id', 'model_type'],
                'model_has_permissions_permission_model_type_primary'
            );
        });
    }

    public function down(): void
    {
        // Restore model_has_roles
        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->dropPrimary('model_has_roles_role_model_type_primary');
        });

        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->dropIndex('model_has_roles_store_id_index');
            $table->dropColumn('store_id');
            
            $table->primary(
                ['role_id', 'model_id', 'model_type'],
                'model_has_roles_role_model_type_primary'
            );
        });

        // Restore model_has_permissions
        Schema::table('model_has_permissions', function (Blueprint $table) {
            $table->dropPrimary('model_has_permissions_permission_model_type_primary');
        });

        Schema::table('model_has_permissions', function (Blueprint $table) {
            $table->dropIndex('model_has_permissions_store_id_index');
            $table->dropColumn('store_id');
            
            $table->primary(
                ['permission_id', 'model_id', 'model_type'],
                'model_has_permissions_permission_model_type_primary'
            );
        });
    }
};
