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
        if (!Schema::hasColumn('model_has_roles', 'store_id')) {
            Schema::table('model_has_roles', function (Blueprint $table) {
                $foreignKeys = $this->listTableForeignKeys('model_has_roles');
                if (in_array('model_has_roles_role_id_foreign', $foreignKeys)) {
                    $table->dropForeign(['role_id']);
                }
                
                $indexes = $this->listTableIndexes('model_has_roles');
                if (in_array('PRIMARY', $indexes)) {
                    $table->dropPrimary('model_has_roles_role_model_type_primary');
                }
                
                $table->unsignedBigInteger('store_id')->nullable()->after('role_id');
                
                if (!in_array('model_has_roles_store_id_index', $indexes)) {
                    $table->index('store_id', 'model_has_roles_store_id_index');
                }
                if (!in_array('model_has_roles_role_id_index', $indexes)) {
                    $table->index('role_id', 'model_has_roles_role_id_index');
                }
            });

            DB::statement("
                UPDATE model_has_roles mhr
                JOIN users u ON u.id = mhr.model_id AND mhr.model_type = 'App\\\\Models\\\\User'
                SET mhr.store_id = u.store_id
                WHERE u.store_id IS NOT NULL
            ");

            Schema::table('model_has_roles', function (Blueprint $table) {
                $indexes = $this->listTableIndexes('model_has_roles');
                if (!in_array('model_has_roles_store_role_unique', $indexes)) {
                    $table->unique(
                        ['store_id', 'role_id', 'model_id', 'model_type'],
                        'model_has_roles_store_role_unique'
                    );
                }
                
                $foreignKeys = $this->listTableForeignKeys('model_has_roles');
                if (!in_array('model_has_roles_role_id_foreign', $foreignKeys)) {
                    $table->foreign('role_id')
                        ->references('id')
                        ->on('roles')
                        ->onDelete('cascade');
                }
            });
        }

        // Add store_id to model_has_permissions
        if (!Schema::hasColumn('model_has_permissions', 'store_id')) {
            Schema::table('model_has_permissions', function (Blueprint $table) {
                $foreignKeys = $this->listTableForeignKeys('model_has_permissions');
                if (in_array('model_has_permissions_permission_id_foreign', $foreignKeys)) {
                    $table->dropForeign(['permission_id']);
                }
                
                $indexes = $this->listTableIndexes('model_has_permissions');
                if (in_array('PRIMARY', $indexes)) {
                    $table->dropPrimary('model_has_permissions_permission_model_type_primary');
                }
                
                $table->unsignedBigInteger('store_id')->nullable()->after('permission_id');
                
                if (!in_array('model_has_permissions_store_id_index', $indexes)) {
                    $table->index('store_id', 'model_has_permissions_store_id_index');
                }
                if (!in_array('model_has_permissions_permission_id_index', $indexes)) {
                    $table->index('permission_id', 'model_has_permissions_permission_id_index');
                }
            });

            DB::statement("
                UPDATE model_has_permissions mhp
                JOIN users u ON u.id = mhp.model_id AND mhp.model_type = 'App\\\\Models\\\\User'
                SET mhp.store_id = u.store_id
                WHERE u.store_id IS NOT NULL
            ");

            Schema::table('model_has_permissions', function (Blueprint $table) {
                $indexes = $this->listTableIndexes('model_has_permissions');
                if (!in_array('model_has_permissions_store_perm_unique', $indexes)) {
                    $table->unique(
                        ['store_id', 'permission_id', 'model_id', 'model_type'],
                        'model_has_permissions_store_perm_unique'
                    );
                }
                
                $foreignKeys = $this->listTableForeignKeys('model_has_permissions');
                if (!in_array('model_has_permissions_permission_id_foreign', $foreignKeys)) {
                    $table->foreign('permission_id')
                        ->references('id')
                        ->on('permissions')
                        ->onDelete('cascade');
                }
            });
        }
    }

    public function down(): void
    {
        // Restore model_has_roles
        if (Schema::hasColumn('model_has_roles', 'store_id')) {
            Schema::table('model_has_roles', function (Blueprint $table) {
                $foreignKeys = $this->listTableForeignKeys('model_has_roles');
                if (in_array('model_has_roles_role_id_foreign', $foreignKeys)) {
                    $table->dropForeign(['role_id']);
                }
            });

            Schema::table('model_has_roles', function (Blueprint $table) {
                $indexes = $this->listTableIndexes('model_has_roles');
                
                if (in_array('model_has_roles_store_id_index', $indexes)) {
                    $table->dropIndex('model_has_roles_store_id_index');
                }
                if (in_array('model_has_roles_role_id_index', $indexes)) {
                    $table->dropIndex('model_has_roles_role_id_index');
                }
                if (in_array('model_has_roles_store_role_unique', $indexes)) {
                    $table->dropUnique('model_has_roles_store_role_unique');
                }
                
                $table->dropColumn('store_id');
                
                $table->primary(
                    ['role_id', 'model_id', 'model_type'],
                    'model_has_roles_role_model_type_primary'
                );
                
                $table->foreign('role_id')
                    ->references('id')
                    ->on('roles')
                    ->onDelete('cascade');
            });
        }

        // Restore model_has_permissions
        if (Schema::hasColumn('model_has_permissions', 'store_id')) {
            Schema::table('model_has_permissions', function (Blueprint $table) {
                $foreignKeys = $this->listTableForeignKeys('model_has_permissions');
                if (in_array('model_has_permissions_permission_id_foreign', $foreignKeys)) {
                    $table->dropForeign(['permission_id']);
                }
                
                $indexes = $this->listTableIndexes('model_has_permissions');
                if (in_array('model_has_permissions_store_perm_unique', $indexes)) {
                    $table->dropUnique('model_has_permissions_store_perm_unique');
                }
            });

            Schema::table('model_has_permissions', function (Blueprint $table) {
                $indexes = $this->listTableIndexes('model_has_permissions');
                
                if (in_array('model_has_permissions_store_id_index', $indexes)) {
                    $table->dropIndex('model_has_permissions_store_id_index');
                }
                if (in_array('model_has_permissions_permission_id_index', $indexes)) {
                    $table->dropIndex('model_has_permissions_permission_id_index');
                }
                
                $table->dropColumn('store_id');
                
                $table->primary(
                    ['permission_id', 'model_id', 'model_type'],
                    'model_has_permissions_permission_model_type_primary'
                );

                $table->foreign('permission_id')
                    ->references('id')
                    ->on('permissions')
                    ->onDelete('cascade');
            });
        }
    }

    private function listTableForeignKeys(string $table): array
    {
        $conn = Schema::getConnection();
        $dbName = $conn->getDatabaseName();
        
        $foreignKeys = DB::select("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = ? 
            AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        ", [$dbName, $table]);

        return array_map(fn($key) => $key->CONSTRAINT_NAME, $foreignKeys);
    }

    private function listTableIndexes(string $table): array
    {
        $conn = Schema::getConnection();
        $dbName = $conn->getDatabaseName();
        
        $indexes = DB::select("
            SELECT DISTINCT INDEX_NAME 
            FROM information_schema.STATISTICS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = ?
        ", [$dbName, $table]);

        return array_map(fn($index) => $index->INDEX_NAME, $indexes);
    }
};
