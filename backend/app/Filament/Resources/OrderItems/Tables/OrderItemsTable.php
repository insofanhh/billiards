<?php

namespace App\Filament\Resources\OrderItems\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\ViewAction;
use Filament\Actions\DeleteAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class OrderItemsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('order.order_code')
                    ->label('Mã đơn hàng')
                    ->searchable()
                    ->sortable()
                    ->copyable(),
                TextColumn::make('service.name')
                    ->label('Dịch vụ')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('qty')
                    ->label('Số lượng')
                    ->numeric()
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('unit_price')
                    ->label('Đơn giá')
                    ->money('VND', locale: 'vi')
                    ->sortable()
                    ->alignEnd(),
                TextColumn::make('total_price')
                    ->label('Tổng tiền')
                    ->money('VND', locale: 'vi')
                    ->sortable()
                    ->alignEnd()
                    ->weight('bold'),
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
                SelectFilter::make('order_id')
                    ->label('Đơn hàng')
                    ->relationship('order', 'order_code'),
                SelectFilter::make('service_id')
                    ->label('Dịch vụ')
                    ->relationship('service', 'name'),
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
            ->defaultSort('created_at', 'desc');
    }
}
