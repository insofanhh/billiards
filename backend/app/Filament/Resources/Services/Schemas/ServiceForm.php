<?php

namespace App\Filament\Resources\Services\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class ServiceForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->label('Tên dịch vụ')
                    ->required()
                    ->maxLength(255),
                Textarea::make('description')
                    ->label('Mô tả')
                    ->rows(3)
                    ->columnSpanFull(),
                TextInput::make('price')
                    ->label('Giá')
                    ->required()
                    ->numeric()
                    ->minValue(0)
                    ->prefix('₫')
                    ->helperText('Nhập giá theo VND'),
                Select::make('charge_type')
                    ->label('Loại tính phí')
                    ->options([
                        'per_unit' => 'Theo đơn vị',
                        'one_time' => 'Một lần',
                    ])
                    ->required()
                    ->default('per_unit'),
                Toggle::make('active')
                    ->label('Kích hoạt')
                    ->default(true)
                    ->helperText('Dịch vụ có đang hoạt động không'),
            ]);
    }
}
