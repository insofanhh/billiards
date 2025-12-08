<?php

namespace Database\Seeders;

use App\Models\TableBilliard;
use Illuminate\Database\Seeder;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class TableBilliardSeeder extends Seeder
{
    public function run(): void
    {
        for ($i = 1; $i <= 10; $i++) {
            $code = 'T' . str_pad($i, 2, '0', STR_PAD_LEFT);
            $qrUrl = url("/api/tables/{$code}");
            
            TableBilliard::updateOrCreate(
                ['code' => $code],
                [
                    'name' => "Bàn {$i}",
                    'seats' => 4,
                    'qr_code' => $qrUrl,
                    'location' => "Tầng 1 - Khu vực " . ceil($i / 5),
                    'status_id' => 1,
                    'table_type_id' => ($i <= 5) ? 1 : (($i <= 8) ? 2 : 3),
                ]
            );
        }
    }
}
