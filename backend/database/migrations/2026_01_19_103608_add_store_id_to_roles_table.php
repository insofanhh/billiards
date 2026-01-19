<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('roles', 'store_id')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->foreignId('store_id')->nullable()->constrained('stores')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('roles', 'store_id')) {
            Schema::table('roles', function (Blueprint $table) {
                $foreignKeys = $this->listTableForeignKeys('roles');
                if (in_array('roles_store_id_foreign', $foreignKeys)) {
                    $table->dropForeign(['store_id']);
                }
                $table->dropColumn('store_id');
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
};
