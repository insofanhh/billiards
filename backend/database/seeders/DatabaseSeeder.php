<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            TableStatusSeeder::class,
            TableTypeSeeder::class,
            TableBilliardSeeder::class,
            ServiceSeeder::class,
            UserSeeder::class,
            PlatformAdminSeeder::class,
        ]);
    }
}
