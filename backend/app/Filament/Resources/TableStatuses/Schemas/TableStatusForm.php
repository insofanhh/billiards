<?php

namespace App\Filament\Resources\TableStatuses\Schemas;

use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class TableStatusForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('name')
                    ->label('Tên trạng thái')
                    ->options([
                        'Trống' => 'Trống',
                        'Đang sử dụng' => 'Đang sử dụng',
                        'Bảo trì' => 'Bảo trì',
                    ])
                    ->required(),
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
