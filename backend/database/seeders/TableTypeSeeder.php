<?php

namespace Database\Seeders;

use App\Models\PriceRate;
use App\Models\TableType;
use Illuminate\Database\Seeder;

class TableTypeSeeder extends Seeder
{
    public function run(): void
    {
        $type1 = TableType::updateOrCreate(['name' => 'Bàn thường'], ['description' => 'Bàn billiards tiêu chuẩn']);
        PriceRate::updateOrCreate(
            ['table_type_id' => $type1->id, 'active' => true],
            ['price_per_hour' => 50000]
        );
        
        $type2 = TableType::updateOrCreate(['name' => 'Bàn VIP'], ['description' => 'Bàn billiards cao cấp']);
        PriceRate::updateOrCreate(
            ['table_type_id' => $type2->id, 'active' => true],
            ['price_per_hour' => 80000]
        );
        
        $type3 = TableType::updateOrCreate(['name' => 'Bàn Pro'], ['description' => 'Bàn billiards chuyên nghiệp']);
        PriceRate::updateOrCreate(
            ['table_type_id' => $type3->id, 'active' => true],
            ['price_per_hour' => 100000]
        );
    }
}
