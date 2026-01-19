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
                // Drop FK to allow dropping PK/Index
                $table->dropForeign(['role_id']);
                
                // Drop old primary key
                $table->dropPrimary('model_has_roles_role_model_type_primary');
                
                // Add store_id column
                $table->unsignedBigInteger('store_id')->nullable()->after('role_id');
                $table->index('store_id', 'model_has_roles_store_id_index');
                
                // Add index for role_id since it's no longer first column in PK
                $table->index('role_id', 'model_has_roles_role_id_index');
            }
        });

        // Update existing records to populate store_id from users table
        DB::statement("
            UPDATE model_has_roles mhr
            JOIN users u ON u.id = mhr.model_id AND mhr.model_type = 'App\\\\Models\\\\User'
            SET mhr.store_id = u.store_id
            WHERE u.store_id IS NOT NULL
        ");

        // Add new primary key including store_id and Restore FK
        Schema::table('model_has_roles', function (Blueprint $table) {
            // Cannot use primary key with nullable store_id in MySQL
            // generic primary key cannot contain null
            // We use unique index instead
            $table->unique(
                ['store_id', 'role_id', 'model_id', 'model_type'],
                'model_has_roles_store_role_unique'
            );
            
            // Re-add FK if it doesn't exist (safety check not strictly needed if we know flow, but good practice)
            // But since we are in a migration retry scenario, it might have failed before adding this
            $table->foreign('role_id')
                ->references('id')
                ->on('roles')
                ->onDelete('cascade');
        });

        // Add store_id to model_has_permissions
        Schema::table('model_has_permissions', function (Blueprint $table) {
            if (!Schema::hasColumn('model_has_permissions', 'store_id')) {
                // Drop FK
                $table->dropForeign(['permission_id']);
                
                // Drop old primary key
                $table->dropPrimary('model_has_permissions_permission_model_type_primary');
                
                // Add store_id column
                $table->unsignedBigInteger('store_id')->nullable()->after('permission_id');
                $table->index('store_id', 'model_has_permissions_store_id_index');
                
                // Add index for permission_id
                $table->index('permission_id', 'model_has_permissions_permission_id_index');
            }
        });

        // Update existing records
        DB::statement("
            UPDATE model_has_permissions mhp
            JOIN users u ON u.id = mhp.model_id AND mhp.model_type = 'App\\\\Models\\\\User'
            SET mhp.store_id = u.store_id
            WHERE u.store_id IS NOT NULL
        ");

        // Add new primary key including store_id and Restore FK
        Schema::table('model_has_permissions', function (Blueprint $table) {
            $table->unique(
                ['store_id', 'permission_id', 'model_id', 'model_type'],
                'model_has_permissions_store_perm_unique'
            );
             
            $table->foreign('permission_id')
                ->references('id')
                ->on('permissions')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        // Restore model_has_roles
        Schema::table('model_has_roles', function (Blueprint $table) {
             // Drop FK so we can mess with indexes/PK
             $table->dropForeign(['role_id']);
             // No primary key to drop, we drop unique index in next block
        });

        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->dropIndex('model_has_roles_store_id_index');
            $table->dropIndex('model_has_roles_role_id_index'); // Drop the helper index
            $table->dropUnique('model_has_roles_store_role_unique'); // Drop unique index
            $table->dropColumn('store_id');
            
            $table->primary(
                ['role_id', 'model_id', 'model_type'],
                'model_has_roles_role_model_type_primary'
            );
            
            // Restore FK
            $table->foreign('role_id')
                ->references('id')
                ->on('roles')
                ->onDelete('cascade');
        });

        // Restore model_has_permissions
        Schema::table('model_has_permissions', function (Blueprint $table) {
             $table->dropForeign(['permission_id']);
             $table->dropUnique('model_has_permissions_store_perm_unique'); // Drop unique index
        });

        Schema::table('model_has_permissions', function (Blueprint $table) {
            $table->dropIndex('model_has_permissions_store_id_index');
            $table->dropIndex('model_has_permissions_permission_id_index'); // Drop helper index
            $table->dropColumn('store_id');
            
            $table->primary(
                ['permission_id', 'model_id', 'model_type'],
                'model_has_permissions_permission_model_type_primary'
            );

            // Restore FK
            $table->foreign('permission_id')
                ->references('id')
                ->on('permissions')
                ->onDelete('cascade');
        });
    }
};
