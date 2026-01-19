<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Platform Admin first (no store needed)
        $this->call([
            PlatformAdminSeeder::class,
        ]);
        
        // 2. Create a default store for seeding
        $store = \App\Models\Store::firstOrCreate(
            ['slug' => 'demo'],
            [
                'name' => 'Demo Store',
                'owner_id' => null,
            ]
        );
        
        $this->command->info("✓ Default store created/found: {$store->name} ({$store->slug})");
        
        // 3. Bind store to context for remaining seeders
        app()->instance('currentStoreId', $store->id);
        app()->instance('currentStore', $store);
        
        // 4. Seed store-specific data
        $this->call([
            TableStatusSeeder::class,
            TableTypeSeeder::class,
            TableBilliardSeeder::class,
            ServiceSeeder::class,
            UserSeeder::class,
        ]);
        
        // 5. Update store owner to the admin user
        $admin = \App\Models\User::where('email', 'admin@billiards.com')
            ->where('store_id', $store->id)
            ->first();
            
        if ($admin && !$store->owner_id) {
            $store->owner_id = $admin->id;
            $store->save();
            $this->command->info("✓ Store owner updated to: {$admin->name}");
        }
        
        $this->command->info("\n=== Seeding completed ===");
        $this->command->info("Platform Admin created!");
        $this->command->info("Store Admin created! (Store: demo)");
    }
}
