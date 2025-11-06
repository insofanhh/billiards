<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        Service::updateOrCreate(['name' => 'Nước suối'], ['description' => 'Nước suối', 'price' => 10000, 'charge_type' => 'per_unit', 'active' => true]);
        Service::updateOrCreate(['name' => 'Nước ngọt'], ['description' => 'Coca, Pepsi, 7Up', 'price' => 15000, 'charge_type' => 'per_unit', 'active' => true]);
        Service::updateOrCreate(['name' => 'Bia'], ['description' => 'Bia Tiger, Heineken', 'price' => 25000, 'charge_type' => 'per_unit', 'active' => true]);
        Service::updateOrCreate(['name' => 'Đồ ăn vặt'], ['description' => 'Khoai tây chiên, gà viên', 'price' => 30000, 'charge_type' => 'per_unit', 'active' => true]);
        Service::updateOrCreate(['name' => 'Phí vệ sinh'], ['description' => 'Phí vệ sinh bàn', 'price' => 20000, 'charge_type' => 'one_time', 'active' => true]);
    }
}
