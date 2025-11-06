<?php

namespace App\Filament\Resources\PriceRates\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class PriceRateForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('table_type_id')
                    ->label('Loại bàn')
                    ->relationship('tableType', 'name')
                    ->required()
                    ->searchable()
                    ->preload(),
                TextInput::make('price_per_hour')
                    ->label('Giá mỗi giờ')
                    ->required()
                    ->numeric()
                    ->minValue(0)
                    ->prefix('₫')
                    ->helperText('Nhập giá theo VND'),
                Toggle::make('active')
                    ->label('Kích hoạt')
                    ->default(true)
                    ->helperText('Bảng giá có đang hoạt động không'),
            ]);
    }
}
