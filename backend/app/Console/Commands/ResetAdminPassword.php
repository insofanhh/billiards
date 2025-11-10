<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class ResetAdminPassword extends Command
{
    protected $signature = 'admin:reset-password {--email=admin@billiards.com} {--password=password}';

    protected $description = 'Reset admin password and ensure super_admin role is assigned';

    public function handle()
    {
        $email = $this->option('email');
        $password = $this->option('password');

        $admin = User::where('email', $email)->first();

        if (!$admin) {
            $this->error("User with email {$email} not found.");
            return 1;
        }

        $admin->password = Hash::make($password);
        $admin->save();

        $this->info("Password reset for {$email}");

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $superAdminRole = Role::firstOrCreate(
            ['name' => 'super_admin', 'guard_name' => 'web']
        );

        if (!$admin->hasRole('super_admin')) {
            $admin->assignRole($superAdminRole);
            $this->info("Assigned super_admin role to {$email}");
        } else {
            $this->info("User {$email} already has super_admin role");
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->info("Admin password reset successfully. Email: {$email}, Password: {$password}");

        return 0;
    }
}
