<?php

namespace App\Filament\Resources\PurchaseOrders\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class PurchaseOrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(1)
            ->components([
                \Filament\Schemas\Components\Grid::make(3)
                    ->schema([
                        // Row 1: General Info (Left) and Summary (Right)
                        \Filament\Schemas\Components\Section::make('Thông tin chung')
                            ->schema([
                                TextInput::make('code')
                                    ->label('Mã đơn hàng')
                                    ->required()
                                    ->unique(ignoreRecord: true),
                                TextInput::make('supplier_name')
                                    ->label('Nhà cung cấp')
                                    ->required(),
                            ])
                            ->columnSpan(2)
                            ->columns(2),

                        \Filament\Schemas\Components\Section::make('Tổng quan')
                            ->schema([
                                \Filament\Forms\Components\Select::make('status')
                                    ->label('Trạng thái')
                                    ->required()
                                    ->options(fn (?\App\Models\PurchaseOrder $record) => [
                                        'draft' => 'Nháp',
                                        'ordered' => 'Đã đặt hàng',
                                        'cancelled' => 'Đã hủy',
                                        ...($record?->status === 'completed' ? ['completed' => 'Đã nhập kho'] : []),
                                    ])
                                    ->default('draft')
                                    ->native(false),
                                
                                TextInput::make('total_amount')
                                    ->label('Tổng tiền')
                                    ->required()
                                    ->suffix('VNĐ')
                                    ->default(0)
                                    ->readOnly()
                                    ->dehydrateStateUsing(fn ($state) => (float) str_replace(['.', ','], ['', '.'], $state)),

                                \Filament\Forms\Components\Placeholder::make('created_at')
                                    ->label('Ngày tạo')
                                    ->content(fn (? \App\Models\PurchaseOrder $record): string => $record?->created_at?->diffForHumans() ?? '-')
                                    ->hidden(fn (? \App\Models\PurchaseOrder $record) => $record === null),
                                    
                                \Filament\Forms\Components\Placeholder::make('creator')
                                    ->label('Người tạo')
                                    ->content(fn (? \App\Models\PurchaseOrder $record): string => $record?->creator?->name ?? '-')
                                    ->hidden(fn (? \App\Models\PurchaseOrder $record) => $record === null),
                            ])
                            ->columnSpan(1),

                        // Row 2: Items (Full Width)
                        \Filament\Schemas\Components\Section::make('Chi tiết hàng hóa')
                            ->schema([
                                \Filament\Forms\Components\Repeater::make('items')
                                    ->label('Danh sách sản phẩm')
                                    ->relationship()
                                    ->schema([
                                        Select::make('service_id')
                                            ->label('Dịch vụ')
                                            ->relationship('service', 'name')
                                            ->required()
                                            ->searchable()
                                            ->preload()
                                            ->distinct()
                                            ->disableOptionsWhenSelectedInSiblingRepeaterItems()
                                            ->columnSpan(2),
                                        TextInput::make('quantity')
                                            ->label('Số lượng')
                                            ->numeric()
                                            ->default(1)
                                            ->required()
                                            ->live()
                                            ->afterStateUpdated(fn ($state, $set, $get) => 
                                                $set('total_price', number_format((float)$state * (float)$get('unit_price'), 0, ',', '.'))
                                            )
                                            ->columnSpan(1),
                                        TextInput::make('unit_price')
                                            ->label('Đơn giá nhập')
                                            ->numeric()
                                            ->default(0)
                                            ->required()
                                            ->live()
                                            ->afterStateUpdated(fn ($state, $set, $get) => 
                                                $set('total_price', number_format((float)$state * (float)$get('quantity'), 0, ',', '.'))
                                            )
                                            ->columnSpan(1),
                                        TextInput::make('total_price')
                                            ->label('Thành tiền')
                                            ->suffix('VNĐ')
                                            ->readOnly()
                                            ->default(0)
                                            ->dehydrateStateUsing(fn ($state) => (float) str_replace(['.', ','], ['', '.'], $state))
                                            ->columnSpan(1),
                                    ])
                                    ->columns(5)
                                    ->live()
                                    ->afterStateUpdated(function ($get, $set) {
                                        $items = $get('items');
                                        $sum = collect($items)->sum(function ($item) {
                                            $price = $item['total_price'] ?? 0;
                                            // Cleaning format 1.000.000 -> 1000000
                                            return (float) str_replace(['.', ','], ['', '.'], $price);
                                        });
                                        $set('total_amount', number_format($sum, 0, ',', '.'));
                                    }),
                            ])
                            ->columnSpan(3),
                    ])
            ]);
    }
}
