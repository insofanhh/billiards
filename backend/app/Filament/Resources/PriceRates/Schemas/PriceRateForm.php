<?php

namespace App\Filament\Resources\PriceRates\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\TimePicker;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class PriceRateForm
{
    public static function configure(Schema $schema): Schema
    {
        $dayOptions = [
            0 => 'Chủ nhật',
            1 => 'Thứ 2',
            2 => 'Thứ 3',
            3 => 'Thứ 4',
            4 => 'Thứ 5',
            5 => 'Thứ 6',
            6 => 'Thứ 7',
        ];

        return $schema
            ->components([
                Select::make('table_type_id')
                    ->label('Loại bàn')
                    ->relationship('tableType', 'name')
                    ->required()
                    ->searchable()
                    ->preload(),
                TextInput::make('price_per_hour')
                    ->label('Giá mỗi giờ')
                    ->required()
                    ->numeric()
                    ->default(0)
                    ->minValue(0)
                    ->prefix('₫')
                    ->helperText('Nhập giá theo VND'),
                Select::make('day_of_week')
                    ->label('Ngày trong tuần')
                    ->options($dayOptions)
                    ->multiple()
                    ->searchable()
                    ->helperText('Chọn ngày áp dụng giá. Để trống nếu áp dụng mọi ngày'),
                TimePicker::make('start_time')
                    ->label('Giờ bắt đầu')
                    ->seconds(false)
                    ->helperText('Giờ bắt đầu áp dụng giá. Để trống nếu áp dụng cả ngày. Có thể nhập giờ kết thúc nhỏ hơn giờ bắt đầu để tạo khoảng thời gian qua đêm (VD: 18:00 - 05:59)'),
                TimePicker::make('end_time')
                    ->label('Giờ kết thúc')
                    ->seconds(false)
                    ->helperText('Giờ kết thúc áp dụng giá. Để trống nếu áp dụng cả ngày. Nếu nhỏ hơn giờ bắt đầu sẽ là khoảng thời gian qua đêm (VD: 18:00 - 05:59 nghĩa là từ 6h tối hôm trước đến 5h59 sáng hôm sau)')
                    ->nullable()
                    ->rules(function ($get) {
                        return [];
                    })
                    ->dehydrated(),
                TextInput::make('priority')
                    ->label('Độ ưu tiên')
                    ->numeric()
                    ->default(0)
                    ->helperText('Giá trị cao hơn = ưu tiên hơn khi có nhiều bảng giá khớp thời gian'),
                Toggle::make('active')
                    ->label('Kích hoạt')
                    ->default(true)
                    ->helperText('Bảng giá có đang hoạt động không'),
            ]);
    }
}
