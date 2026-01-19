<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\Store;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class SeedStorePermissions extends Command
{
    protected $signature = 'store:seed-permissions {store_id?}';

    protected $description = 'Seed permissions for store(s). If store_id is provided, only that store. Otherwise all stores.';

    public function handle()
    {
        $storeId = $this->argument('store_id');
        
        if ($storeId) {
            $stores = Store::where('id', $storeId)->get();
            if ($stores->isEmpty()) {
                $this->error("Store with ID {$storeId} not found.");
                return 1;
            }
        } else {
            $stores = Store::all();
        }

        if ($stores->isEmpty()) {
            $this->warn('No stores found.');
            return 0;
        }

        $permissions = Permission::all();
        if ($permissions->isEmpty()) {
            $this->warn('No permissions found. Run: php artisan shield:generate --all --panel=admin');
            return 1;
        }

        foreach ($stores as $store) {
            $this->info("Processing store: {$store->name} (ID: {$store->id})");
            
            app()->instance('currentStoreId', $store->id);
            app()->instance('currentStore', $store);

            $roleNames = ['super_admin', 'admin', 'customer'];
            foreach ($roleNames as $roleName) {
                $role = Role::firstOrCreate([
                    'name' => $roleName,
                    'guard_name' => 'web',
                    'store_id' => $store->id
                ]);

                if ($roleName === 'super_admin') {
                    $role->syncPermissions($permissions);
                    $this->info("  ✓ Synced {$permissions->count()} permissions to {$roleName} role");
                } else {
                    $this->info("  ✓ Created/verified {$roleName} role");
                }
            }
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        $this->info("\nPermission cache cleared.");
        $this->info('Done!');

        return 0;
    }
}
