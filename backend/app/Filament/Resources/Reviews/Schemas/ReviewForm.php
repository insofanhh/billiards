<?php

namespace App\Filament\Resources\Reviews\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class ReviewForm
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
                Select::make('user_id')
                    ->label('Khách hàng')
                    ->relationship('user', 'name')
                    ->required()
                    ->searchable()
                    ->preload(),
                TextInput::make('rating')
                    ->label('Đánh giá')
                    ->required()
                    ->numeric()
                    ->minValue(1)
                    ->maxValue(5)
                    ->helperText('Đánh giá từ 1 đến 5 sao'),
                Textarea::make('comment')
                    ->label('Bình luận')
                    ->rows(4)
                    ->columnSpanFull(),
            ]);
    }
}
