<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@billiards.com'],
            [
                'name' => 'Admin',
                'phone' => '0123456789',
                'password' => Hash::make('password'),
            ]
        );

        $staff = User::updateOrCreate(
            ['email' => 'staff@billiards.com'],
            [
                'name' => 'Staff',
                'phone' => '0123456790',
                'password' => Hash::make('password'),
            ]
        );

        $customer = User::updateOrCreate(
            ['email' => 'customer@billiards.com'],
            [
                'name' => 'Customer',
                'phone' => '0123456791',
                'password' => Hash::make('password'),
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

        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin']);
        $staffRole = Role::firstOrCreate(['name' => 'staff']);
        $customerRole = Role::firstOrCreate(['name' => 'customer']);

        if (!$admin->hasRole('super_admin')) {
            $admin->assignRole($superAdminRole);
            $this->command->info('Assigned Super Admin role to admin. Please write down "admin" to continue!');
        } else {
            $this->command->info('Admin already has Super Admin role.');
        }

        if (!$staff->hasRole('staff')) {
            $staff->assignRole($staffRole);
            $this->command->info('Assigned Staff role to staff user.');
        } else {
            $this->command->info('Staff already has Staff role.');
        }

        if (!$customer->hasRole('customer')) {
            $customer->assignRole($customerRole);
            $this->command->info('Assigned Customer role to customer user.');
        } else {
            $this->command->info('Customer already has Customer role.');
        }

        Artisan::call('shield:generate', [
            '--all' => true,
            '--panel' => 'admin',
        ]);
        $this->command->info('Permissions and roles generated successfully.');
    }
}
