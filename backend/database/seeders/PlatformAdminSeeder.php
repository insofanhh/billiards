<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PlatformAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear currentStoreId to ensure platform admin is not scoped
        app()->forgetInstance('currentStoreId');
        app()->forgetInstance('currentStore');
        
        // Platform Admin has no store_id (null)
        $platformAdmin = User::withoutGlobalScopes()->firstOrCreate(
            ['email' => 'admin@platform.com'],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make('password'),
                'store_id' => null,
            ]
        );
        
        if ($platformAdmin->wasRecentlyCreated) {
            $this->command->info('Platform Admin account created!');
        } else {
            $this->command->info('Platform Admin account already exists!');
        }
    }
}
