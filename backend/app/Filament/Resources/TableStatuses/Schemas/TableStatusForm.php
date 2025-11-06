<?php

namespace App\Filament\Resources\TableStatuses\Schemas;

use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class TableStatusForm
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
                    ->default('#000000')
                    ->helperText('Màu sắc hiển thị cho trạng thái này'),
            ]);
    }
}
