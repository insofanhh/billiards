<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
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
                'name' => 'Nhân viên',
                'phone' => '0123456790',
                'password' => Hash::make('password'),
            ]
        );

        $customer = User::updateOrCreate(
            ['email' => 'customer@billiards.com'],
            [
                'name' => 'Khách hàng',
                'phone' => '0123456791',
                'password' => Hash::make('password'),
            ]
        );

        $adminRole = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $staffRole = Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
        $customerRole = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

        if (!$admin->hasRole('super_admin')) {
            $admin->assignRole('super_admin');
        }
        if (!$staff->hasRole('staff')) {
            $staff->assignRole('staff');
        }
        if (!$customer->hasRole('customer')) {
            $customer->assignRole('customer');
        }
    }
}
