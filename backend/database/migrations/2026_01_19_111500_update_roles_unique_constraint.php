<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $indexes = $this->listTableIndexes('roles');
        
        if (in_array('roles_name_guard_name_unique', $indexes) && 
            !in_array('roles_name_guard_name_store_id_unique', $indexes)) {
            
            Schema::table('roles', function (Blueprint $table) {
                $table->dropUnique('roles_name_guard_name_unique');
            });

            $this->removeDuplicateRoles();

            Schema::table('roles', function (Blueprint $table) {
                $table->unique(['name', 'guard_name', 'store_id'], 'roles_name_guard_name_store_id_unique');
            });
        }
    }

    public function down(): void
    {
        $indexes = $this->listTableIndexes('roles');
        
        if (in_array('roles_name_guard_name_store_id_unique', $indexes)) {
            Schema::table('roles', function (Blueprint $table) {
                $table->dropUnique('roles_name_guard_name_store_id_unique');
            });

            $this->removeDuplicateRolesBeforeRestore();

            Schema::table('roles', function (Blueprint $table) {
                $indexes = $this->listTableIndexes('roles');
                if (!in_array('roles_name_guard_name_unique', $indexes)) {
                    $table->unique(['name', 'guard_name'], 'roles_name_guard_name_unique');
                }
            });
        }
    }

    private function removeDuplicateRoles(): void
    {
        $duplicates = DB::select("
            SELECT `name`, `guard_name`, COUNT(*) as count
            FROM roles
            WHERE store_id IS NULL
            GROUP BY `name`, `guard_name`
            HAVING count > 1
        ");

        foreach ($duplicates as $duplicate) {
            $roles = DB::table('roles')
                ->where('name', $duplicate->name)
                ->where('guard_name', $duplicate->guard_name)
                ->whereNull('store_id')
                ->orderBy('id')
                ->get();

            foreach ($roles->skip(1) as $role) {
                DB::table('roles')->where('id', $role->id)->delete();
            }
        }
    }

    private function removeDuplicateRolesBeforeRestore(): void
    {
        $duplicates = DB::select("
            SELECT `name`, `guard_name`, COUNT(*) as count
            FROM roles
            GROUP BY `name`, `guard_name`
            HAVING count > 1
        ");

        foreach ($duplicates as $duplicate) {
            $roles = DB::table('roles')
                ->where('name', $duplicate->name)
                ->where('guard_name', $duplicate->guard_name)
                ->orderBy('id')
                ->get();

            foreach ($roles->skip(1) as $role) {
                DB::table('roles')->where('id', $role->id)->delete();
            }
        }
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
