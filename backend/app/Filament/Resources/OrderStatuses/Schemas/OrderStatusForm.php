<?php

namespace App\Filament\Resources\OrderStatuses\Schemas;

use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class OrderStatusForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->label('Tên trạng thái')
                    ->required()
                    ->maxLength(255),
                Textarea::make('description')
                    ->label('Mô tả')
                    ->rows(3)
                    ->columnSpanFull(),
                ColorPicker::make('color')
                    ->label('Màu sắc')
                    ->required()
                    ->default('#6b7280')
                    ->helperText('Màu sắc hiển thị cho trạng thái này'),
                Toggle::make('is_active')
                    ->label('Kích hoạt')
                    ->default(true)
                    ->helperText('Trạng thái có đang hoạt động không'),
            ]);
    }
}
