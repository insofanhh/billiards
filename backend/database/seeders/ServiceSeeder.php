<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\ServiceInventory;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'name' => 'Nước suối',
                'description' => 'Nước suối',
                'price' => 10000,
                'charge_type' => 'per_unit',
                'active' => true,
            ],
            [
                'name' => 'Nước ngọt',
                'description' => 'Coca, Pepsi, 7Up',
                'price' => 15000,
                'charge_type' => 'per_unit',
                'active' => true,
            ],
            [
                'name' => 'Bia',
                'description' => 'Bia Tiger, Heineken',
                'price' => 25000,
                'charge_type' => 'per_unit',
                'active' => true,
            ],
            [
                'name' => 'Đồ ăn vặt',
                'description' => 'Khoai tây chiên, gà viên',
                'price' => 30000,
                'charge_type' => 'per_unit',
                'active' => true,
            ],
            [
                'name' => 'Phí vệ sinh',
                'description' => 'Phí vệ sinh bàn',
                'price' => 20000,
                'charge_type' => 'one_time',
                'active' => true,
            ],
        ];

        foreach ($services as $data) {
            $service = Service::updateOrCreate(
                ['name' => $data['name']],
                [
                    'description' => $data['description'],
                    'price' => $data['price'],
                    'charge_type' => $data['charge_type'],
                    'active' => $data['active'],
                ]
            );

            ServiceInventory::firstOrCreate(['service_id' => $service->id]);
        }
    }
}
