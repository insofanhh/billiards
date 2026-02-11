<?php

namespace App\Filament\Resources\ServiceInventories\Schemas;

use App\Models\ServiceInventory;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;
use Illuminate\Validation\Rule;

class ServiceInventoryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('service_id')
                    ->label('Dịch vụ')
                    ->relationship('service', 'name')
                    ->searchable()
                    ->preload()
                    ->required()
                    ->rules(fn (?ServiceInventory $record) => [
                        Rule::unique('service_inventories', 'service_id')
                            ->ignore($record?->id),
                    ])
                    ->validationMessages([
                        'unique' => 'Dịch vụ này đã tồn tại trong kho.',
                    ])
                    ->disabledOn('edit'),
                TextInput::make('quantity')
                    ->label('Số lượng')
                    ->numeric()
                    ->required()
                    ->minValue(0)
                    ->default(0)
                    ->disabled(),
                TextInput::make('average_cost')
                    ->label('Giá vốn trung bình')
                    ->numeric()
                    ->readOnly()
                    ->suffix('VNĐ'),
            ]);
    }
}


