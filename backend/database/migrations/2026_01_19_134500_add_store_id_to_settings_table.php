<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('settings', 'store_id')) {
            Schema::table('settings', function (Blueprint $table) {
                $indexes = $this->listTableIndexes('settings');
                if (in_array('settings_group_name_unique', $indexes)) {
                    $table->dropUnique(['group', 'name']);
                }
            });
            
            Schema::table('settings', function (Blueprint $table) {
                $table->unsignedBigInteger('store_id')->nullable()->after('id');
            });
            
            $this->removeDuplicateSettings();
            
            Schema::table('settings', function (Blueprint $table) {
                $indexes = $this->listTableIndexes('settings');
                if (!in_array('settings_group_name_store_id_unique', $indexes)) {
                    $table->unique(['group', 'name', 'store_id'], 'settings_group_name_store_id_unique');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('settings', 'store_id')) {
            Schema::table('settings', function (Blueprint $table) {
                $indexes = $this->listTableIndexes('settings');
                if (in_array('settings_group_name_store_id_unique', $indexes)) {
                    $table->dropUnique('settings_group_name_store_id_unique');
                }
            });
            
            $this->removeDuplicateSettingsBeforeRestore();
            
            Schema::table('settings', function (Blueprint $table) {
                $table->dropColumn('store_id');
                
                $indexes = $this->listTableIndexes('settings');
                if (!in_array('settings_group_name_unique', $indexes)) {
                    $table->unique(['group', 'name'], 'settings_group_name_unique');
                }
            });
        }
    }

    private function removeDuplicateSettings(): void
    {
        $duplicates = DB::select("
            SELECT `group`, `name`, COUNT(*) as count
            FROM settings
            WHERE store_id IS NULL
            GROUP BY `group`, `name`
            HAVING count > 1
        ");

        foreach ($duplicates as $duplicate) {
            $settings = DB::table('settings')
                ->where('group', $duplicate->group)
                ->where('name', $duplicate->name)
                ->whereNull('store_id')
                ->orderBy('id')
                ->get();

            foreach ($settings->skip(1) as $setting) {
                DB::table('settings')->where('id', $setting->id)->delete();
            }
        }
    }

    private function removeDuplicateSettingsBeforeRestore(): void
    {
        $duplicates = DB::select("
            SELECT `group`, `name`, COUNT(*) as count
            FROM settings
            GROUP BY `group`, `name`
            HAVING count > 1
        ");

        foreach ($duplicates as $duplicate) {
            $settings = DB::table('settings')
                ->where('group', $duplicate->group)
                ->where('name', $duplicate->name)
                ->orderBy('id')
                ->get();

            foreach ($settings->skip(1) as $setting) {
                DB::table('settings')->where('id', $setting->id)->delete();
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
