<?php

namespace App\Filament\Resources\TableBilliards\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\ViewAction;
use Filament\Actions\DeleteAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class TableBilliardsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('code')
                    ->label('Mã bàn')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('name')
                    ->label('Tên bàn')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('seats')
                    ->label('Số ghế')
                    ->numeric()
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('status.name')
                    ->label('Trạng thái')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'Trống' => 'success',
                        'Đang sử dụng' => 'danger',
                        'Bảo trì' => 'warning',
                        default => 'gray',
                    })
                    ->sortable(),
                TextColumn::make('tableType.name')
                    ->label('Loại bàn')
                    ->sortable()
                    ->badge()
                    ->color('info'),
                TextColumn::make('location')
                    ->label('Vị trí')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->label('Cập nhật')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status_id')
                    ->label('Trạng thái')
                    ->relationship('status', 'name'),
                SelectFilter::make('table_type_id')
                    ->label('Loại bàn')
                    ->relationship('tableType', 'name'),
            ])
            ->recordActions([
                ViewAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('code', 'asc');
    }
}
