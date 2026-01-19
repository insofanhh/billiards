<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure we have a currentStoreId for tenant-scoped users
        $currentStoreId = app()->has('currentStoreId') ? app('currentStoreId') : null;
        
        if (!$currentStoreId) {
            $this->command->warn('No currentStoreId found. Users will be created without store context.');
            return;
        }
        
        $admin = User::firstOrCreate(
            ['email' => 'admin@billiards.com', 'store_id' => $currentStoreId],
            [
                'name' => 'Admin',
                'phone' => '0123456789',
                'password' => 'password',
            ]
        );

        $staff = User::firstOrCreate(
            ['email' => 'staff@billiards.com', 'store_id' => $currentStoreId],
            [
                'name' => 'Staff',
                'phone' => '0123456790',
                'password' => 'password',
            ]
        );

        $customer = User::firstOrCreate(
            ['email' => 'customer@billiards.com', 'store_id' => $currentStoreId],
            [
                'name' => 'Customer',
                'phone' => '0123456791',
                'password' => 'password',
            ]
        );

        if ($admin->wasRecentlyCreated) {
            $this->command->info('Admin account created successfully.');
        } else {
            $this->command->info('Admin account already exists.');
        }

        if ($staff->wasRecentlyCreated) {
            $this->command->info('Staff account created successfully.');
        } else {
            $this->command->info('Staff account already exists.');
        }

        if ($customer->wasRecentlyCreated) {
            $this->command->info('Customer account created successfully.');
        } else {
            $this->command->info('Customer account already exists.');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Artisan::call('shield:generate', [
            '--all' => true,
            '--panel' => 'admin',
            '--no-interaction' => true,
        ]);
        $this->command->info('Permissions and roles generated successfully.');

        $superAdminRole = Role::firstOrCreate(
            ['name' => 'super_admin', 'guard_name' => 'web']
        );
        $staffRole = Role::firstOrCreate(
            ['name' => 'staff', 'guard_name' => 'web']
        );
        $customerRole = Role::firstOrCreate(
            ['name' => 'customer', 'guard_name' => 'web']
        );

        if (!$admin->hasRole('super_admin')) {
            $admin->assignRole($superAdminRole);
            
            // Update store_id in pivot table
            \Illuminate\Support\Facades\DB::table('model_has_roles')
                ->where('model_id', $admin->id)
                ->where('model_type', get_class($admin))
                ->where('role_id', $superAdminRole->id)
                ->update(['store_id' => $currentStoreId]);
                
            $this->command->info('✓ Assigned Super Admin role to admin.');
        } else {
            $this->command->info('ℹ Admin already has Super Admin role.');
        }

        if (!$staff->hasRole('staff')) {
            $staff->assignRole($staffRole);
            
            \Illuminate\Support\Facades\DB::table('model_has_roles')
                ->where('model_id', $staff->id)
                ->where('model_type', get_class($staff))
                ->where('role_id', $staffRole->id)
                ->update(['store_id' => $currentStoreId]);
                
            $this->command->info('✓ Assigned Staff role to staff user.');
        } else {
            $this->command->info('ℹ Staff already has Staff role.');
        }

        if (!$customer->hasRole('customer')) {
            $customer->assignRole($customerRole);
            
            \Illuminate\Support\Facades\DB::table('model_has_roles')
                ->where('model_id', $customer->id)
                ->where('model_type', get_class($customer))
                ->where('role_id', $customerRole->id)
                ->update(['store_id' => $currentStoreId]);
                
            $this->command->info('✓ Assigned Customer role to customer user.');
        } else {
            $this->command->info('ℹ Customer already has Customer role.');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        $this->command->info('Permission cache cleared.');
    }
}
