<?php

namespace App\Filament\Resources\Orders\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class OrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('order_code')
                    ->label('Mã đơn hàng')
                    ->required()
                    ->maxLength(100)
                    ->unique(ignoreRecord: true)
                    ->disabled()
                    ->dehydrated(),
                Select::make('user_id')
                    ->label('Khách hàng')
                    ->relationship('user', 'name')
                    ->required()
                    ->searchable()
                    ->preload(),
                Select::make('table_id')
                    ->label('Bàn')
                    ->relationship('table', 'name')
                    ->required()
                    ->searchable()
                    ->preload(),
                Select::make('price_rate_id')
                    ->label('Bảng giá')
                    ->relationship('priceRate', 'id', fn ($query) => $query->where('active', true))
                    ->required()
                    ->searchable()
                    ->preload(),
                Select::make('admin_confirmed_by')
                    ->label('Xác nhận bởi')
                    ->relationship('adminConfirmedBy', 'name')
                    ->searchable()
                    ->preload(),
                DateTimePicker::make('start_at')
                    ->label('Thời gian bắt đầu')
                    ->displayFormat('d/m/Y H:i')
                    ->seconds(false),
                DateTimePicker::make('end_at')
                    ->label('Thời gian kết thúc')
                    ->displayFormat('d/m/Y H:i')
                    ->seconds(false),
                Select::make('status')
                    ->label('Trạng thái')
                    ->options([
                        'pending' => 'Chờ xử lý',
                        'active' => 'Đang sử dụng',
                        'completed' => 'Hoàn thành',
                        'cancelled' => 'Đã hủy',
                    ])
                    ->required()
                    ->default('pending'),
                Select::make('applied_discount_id')
                    ->label('Mã giảm giá')
                    ->relationship('appliedDiscount', 'code')
                    ->searchable()
                    ->preload(),
                Select::make('order_status_id')
                    ->label('Trạng thái đơn hàng')
                    ->relationship('orderStatus', 'name')
                    ->searchable()
                    ->preload(),
                TextInput::make('total_play_time_minutes')
                    ->label('Thời gian chơi (phút)')
                    ->numeric()
                    ->disabled()
                    ->dehydrated(),
                TextInput::make('total_before_discount')
                    ->label('Tổng tiền trước giảm giá')
                    ->numeric()
                    ->prefix('₫')
                    ->disabled()
                    ->dehydrated(),
                TextInput::make('total_discount')
                    ->label('Giảm giá')
                    ->numeric()
                    ->prefix('₫')
                    ->disabled()
                    ->dehydrated(),
                TextInput::make('total_paid')
                    ->label('Tổng thanh toán')
                    ->numeric()
                    ->prefix('₫')
                    ->disabled()
                    ->dehydrated(),
                Textarea::make('notes')
                    ->label('Ghi chú')
                    ->rows(3)
                    ->columnSpanFull(),
            ]);
    }
}
