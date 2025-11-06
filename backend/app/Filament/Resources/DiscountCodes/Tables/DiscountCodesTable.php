<?php

namespace App\Filament\Resources\DiscountCodes\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class DiscountCodesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('code')
                    ->label('Mã code')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->copyable(),
                TextColumn::make('description')
                    ->label('Mô tả')
                    ->limit(30)
                    ->toggleable(),
                TextColumn::make('discount_type')
                    ->label('Loại')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'percent' => 'success',
                        'fixed' => 'info',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'percent' => 'Phần trăm',
                        'fixed' => 'Số tiền',
                        default => $state,
                    }),
                TextColumn::make('discount_value')
                    ->label('Giá trị')
                    ->formatStateUsing(function ($record) {
                        return $record->discount_type === 'percent' 
                            ? $record->discount_value . '%'
                            : number_format($record->discount_value, 0, ',', '.') . ' ₫';
                    })
                    ->sortable(),
                TextColumn::make('min_spend')
                    ->label('Đơn tối thiểu')
                    ->money('VND', locale: 'vi')
                    ->toggleable(),
                TextColumn::make('usage_limit')
                    ->label('Giới hạn')
                    ->formatStateUsing(fn ($state) => $state ? $state : 'Không giới hạn')
                    ->toggleable(),
                TextColumn::make('used_count')
                    ->label('Đã dùng')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('start_at')
                    ->label('Bắt đầu')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('end_at')
                    ->label('Kết thúc')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(),
                IconColumn::make('active')
                    ->label('Trạng thái')
                    ->boolean()
                    ->trueColor('success')
                    ->falseColor('danger')
                    ->sortable(),
                TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                TernaryFilter::make('active')
                    ->label('Trạng thái')
                    ->placeholder('Tất cả')
                    ->trueLabel('Đang hoạt động')
                    ->falseLabel('Đã tắt'),
                SelectFilter::make('discount_type')
                    ->label('Loại giảm giá')
                    ->options([
                        'percent' => 'Phần trăm',
                        'fixed' => 'Số tiền',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
