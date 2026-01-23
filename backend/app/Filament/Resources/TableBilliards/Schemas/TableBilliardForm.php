<?php

namespace App\Filament\Resources\TableBilliards\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class TableBilliardForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('code')
                    ->label('Mã bàn')
                    ->required()
                    ->maxLength(50)
                    ->unique(ignoreRecord: true, modifyRuleUsing: function ($rule) {
                        return $rule->where('store_id', \Filament\Facades\Filament::getTenant()->id);
                    })
                    ->helperText('Mã bàn duy nhất (ví dụ: T01, T02). Liên kết QR sẽ tự tạo sau khi lưu.')
                    ->live()
                    ->afterStateHydrated(function ($state, $set, ?\App\Models\TableBilliard $record) {
                        $code = $state ?: ($record?->code ?? null);
                        if ($code) {
                            $base = rtrim(config('app.url'), '/');
                            $slug = \Filament\Facades\Filament::getTenant()?->slug;
                            $set('qr_code', $base . '/s/' . $slug . '/table/' . $code);
                        }
                    })
                    ->afterStateUpdated(function ($state, $set, ?\App\Models\TableBilliard $record) {
                        $code = $state ?: ($record?->code ?? null);
                        if ($code) {
                            $base = rtrim(config('app.url'), '/');
                            $slug = \Filament\Facades\Filament::getTenant()?->slug;
                            $set('qr_code', $base . '/s/' . $slug . '/table/' . $code);
                        }
                    }),
                TextInput::make('name')
                    ->label('Tên bàn')
                    ->required()
                    ->maxLength(255),
                TextInput::make('seats')
                    ->label('Số ghế')
                    ->required()
                    ->numeric()
                    ->minValue(1)
                    ->default(4),
                Textarea::make('qr_code')
                    ->label('Mã QR (URL)')
                    ->maxLength(500)
                    ->rows(2)
                    ->columnSpanFull(),
                TextInput::make('location')
                    ->label('Vị trí')
                    ->maxLength(255)
                    ->helperText('Vị trí bàn trong quán'),
                Select::make('status_id')
                    ->label('Trạng thái')
                    ->relationship('status', 'name')
                    ->required()
                    ->searchable()
                    ->preload()
                    ->default('Trống'),
                Select::make('table_type_id')
                    ->label('Loại bàn')
                    ->relationship('tableType', 'name')
                    ->required()
                    ->searchable()
                    ->preload(),
            ]);
    }
}
