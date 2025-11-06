<?php

namespace App\Filament\Resources\DiscountCodes\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class DiscountCodeForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('code')
                    ->label('Mã giảm giá')
                    ->required()
                    ->maxLength(50)
                    ->unique(ignoreRecord: true)
                    ->helperText('Mã code duy nhất để khách hàng sử dụng'),
                TextInput::make('description')
                    ->label('Mô tả')
                    ->maxLength(255),
                Select::make('discount_type')
                    ->label('Loại giảm giá')
                    ->options([
                        'percent' => 'Phần trăm (%)',
                        'fixed' => 'Số tiền cố định (₫)',
                    ])
                    ->required()
                    ->default('percent'),
                TextInput::make('discount_value')
                    ->label('Giá trị giảm giá')
                    ->required()
                    ->numeric()
                    ->minValue(0)
                    ->helperText('Nếu là phần trăm: nhập 10 cho 10%. Nếu là số tiền: nhập số tiền VND'),
                TextInput::make('min_spend')
                    ->label('Giá trị đơn hàng tối thiểu')
                    ->numeric()
                    ->minValue(0)
                    ->prefix('₫')
                    ->helperText('Đơn hàng phải đạt giá trị này mới được áp dụng mã'),
                TextInput::make('usage_limit')
                    ->label('Giới hạn sử dụng')
                    ->numeric()
                    ->minValue(1)
                    ->helperText('Để trống nếu không giới hạn'),
                TextInput::make('used_count')
                    ->label('Đã sử dụng')
                    ->numeric()
                    ->default(0)
                    ->disabled()
                    ->dehydrated(),
                DateTimePicker::make('start_at')
                    ->label('Bắt đầu')
                    ->helperText('Thời gian bắt đầu có hiệu lực'),
                DateTimePicker::make('end_at')
                    ->label('Kết thúc')
                    ->helperText('Thời gian hết hiệu lực'),
                Toggle::make('active')
                    ->label('Kích hoạt')
                    ->default(true),
            ]);
    }
}
