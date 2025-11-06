<?php

namespace App\Filament\Resources\Transactions\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class TransactionForm
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
                TextInput::make('amount')
                    ->label('Số tiền')
                    ->required()
                    ->numeric()
                    ->minValue(0)
                    ->prefix('₫'),
                Select::make('method')
                    ->label('Phương thức thanh toán')
                    ->options([
                        'cash' => 'Tiền mặt',
                        'card' => 'Thẻ',
                        'mobile' => 'Mobile banking',
                    ])
                    ->required()
                    ->default('cash'),
                Select::make('status')
                    ->label('Trạng thái')
                    ->options([
                        'pending' => 'Chờ xử lý',
                        'success' => 'Thành công',
                        'failed' => 'Thất bại',
                        'refunded' => 'Đã hoàn tiền',
                    ])
                    ->required()
                    ->default('pending'),
                TextInput::make('reference')
                    ->label('Mã tham chiếu')
                    ->maxLength(255)
                    ->helperText('Mã giao dịch từ hệ thống thanh toán'),
            ]);
    }
}
