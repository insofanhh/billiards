<?php

namespace Database\Seeders;

use App\Models\TableStatus;
use Illuminate\Database\Seeder;

class TableStatusSeeder extends Seeder
{
    public function run(): void
    {
        TableStatus::updateOrCreate(['name' => 'Trống'], ['description' => 'Bàn chưa được sử dụng', 'color' => '#10b981']);
        TableStatus::updateOrCreate(['name' => 'Đang sử dụng'], ['description' => 'Bàn đang được sử dụng', 'color' => '#ef4444']);
        TableStatus::updateOrCreate(['name' => 'Bảo trì'], ['description' => 'Bàn đang bảo trì', 'color' => '#f59e0b']);
    }
}
