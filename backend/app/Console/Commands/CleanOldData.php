<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanOldData extends Command
{

    //php artisan data:clean-old --force
    protected $signature = 'data:clean-old {--force : Force deletion without confirmation}';

    protected $description = 'Clean old single-tenant data (records with store_id = NULL)';

    public function handle()
    {
        if (!$this->option('force')) {
            if (!$this->confirm('This will DELETE all records with store_id = NULL. Continue?')) {
                $this->info('Operation cancelled.');
                return 0;
            }
        }

        $this->info('Starting data cleanup...');

        $tables = [
            'users',
            'orders',
            'order_items',
            'transactions',
            'tables_billiards',
            'table_types',
            'services',
            'service_inventories',
            'categories',
            'category_services',
            'posts',
            'comments',
            'discount_codes',
            'price_rates',
            'reviews',
        ];

        $totalDeleted = 0;

        foreach ($tables as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                if (DB::getSchemaBuilder()->hasColumn($table, 'store_id')) {
                    $count = DB::table($table)->whereNull('store_id')->count();
                    if ($count > 0) {
                        DB::table($table)->whereNull('store_id')->delete();
                        $totalDeleted += $count;
                        $this->info("✓ Deleted {$count} records from {$table}");
                    } else {
                        $this->line("  No old data in {$table}");
                    }
                }
            }
        }

        // Clean orphaned permission pivot data
        $orphanedRoles = DB::table('model_has_roles')->whereNull('store_id')->count();
        if ($orphanedRoles > 0) {
            DB::table('model_has_roles')->whereNull('store_id')->delete();
            $totalDeleted += $orphanedRoles;
            $this->info("✓ Deleted {$orphanedRoles} orphaned role assignments");
        }

        $orphanedPerms = DB::table('model_has_permissions')->whereNull('store_id')->count();
        if ($orphanedPerms > 0) {
            DB::table('model_has_permissions')->whereNull('store_id')->delete();
            $totalDeleted += $orphanedPerms;
            $this->info("✓ Deleted {$orphanedPerms} orphaned permission assignments");
        }

        // Clean old settings
        $oldSettings = DB::table('settings')->whereNull('store_id')->count();
        if ($oldSettings > 0) {
            DB::table('settings')->whereNull('store_id')->delete();
            $totalDeleted += $oldSettings;
            $this->info("✓ Deleted {$oldSettings} old settings");
        }

        $this->newLine();
        $this->info("✅ Cleanup completed! Total records deleted: {$totalDeleted}");

        return 0;
    }
}