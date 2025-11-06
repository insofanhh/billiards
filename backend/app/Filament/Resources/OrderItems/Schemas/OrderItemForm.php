<?php

namespace App\Filament\Resources\OrderItems\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class OrderItemForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('order_id')
                    ->label('Đơn hàng')
                    ->relationship('order', 'order_code')
                    ->required()
                    ->searchable()
                    ->preload(),
                Select::make('service_id')
                    ->label('Dịch vụ')
                    ->relationship('service', 'name', fn($query) => $query->where('active', true))
                    ->required()
                    ->searchable()
                    ->preload()
                    ->reactive()
                    ->afterStateUpdated(function ($state, callable $set) {
                        if ($state) {
                            $service = \App\Models\Service::find($state);
                            if ($service) {
                                $set('unit_price', $service->price);
                            }
                        }
                    }),
                TextInput::make('qty')
                    ->label('Số lượng')
                    ->required()
                    ->numeric()
                    ->minValue(1)
                    ->default(1)
                    ->reactive()
                    ->afterStateUpdated(function ($state, callable $get, callable $set) {
                        $unitPrice = $get('unit_price');
                        if ($unitPrice && $state) {
                            $set('total_price', $unitPrice * $state);
                        }
                    }),
                TextInput::make('unit_price')
                    ->label('Đơn giá')
                    ->required()
                    ->numeric()
                    ->minValue(0)
                    ->prefix('₫')
                    ->reactive()
                    ->afterStateUpdated(function ($state, callable $get, callable $set) {
                        $qty = $get('qty') ?? 1;
                        if ($state && $qty) {
                            $set('total_price', $state * $qty);
                        }
                    }),
                TextInput::make('total_price')
                    ->label('Tổng tiền')
                    ->required()
                    ->numeric()
                    ->prefix('₫')
                    ->disabled()
                    ->dehydrated(),
            ]);
    }
}
