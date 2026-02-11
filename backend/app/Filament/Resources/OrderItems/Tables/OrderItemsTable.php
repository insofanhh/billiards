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
                    ->default(fn ($record) => $record->name)
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
                TextColumn::make('inventoryTransaction.unit_cost')
                    ->label('Giá vốn')
                    ->money('VND', locale: 'vi')
                    ->state(fn (\App\Models\OrderItem $record) => $record->inventoryTransaction?->unit_cost ?? $record->service->inventory?->average_cost ?? 0)
                    ->color(fn (\App\Models\OrderItem $record) => $record->inventoryTransaction ? null : 'gray')
                    ->tooltip(fn (\App\Models\OrderItem $record) => $record->inventoryTransaction ? 'Giá vốn thực tế tại thời điểm bán' : 'Giá vốn ước tính hiện tại (do đơn cũ chưa có lịch sử)')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: false),
                TextColumn::make('profit')
                    ->label('Lợi nhuận')
                    ->money('VND', locale: 'vi')
                    ->state(function (\App\Models\OrderItem $record): float {
                        $cost = $record->inventoryTransaction?->unit_cost ?? $record->service->inventory?->average_cost ?? 0;
                        return ($record->unit_price - $cost) * $record->qty;
                    })
                    ->color(fn (string $state): string => (float) $state >= 0 ? 'success' : 'danger')
                    ->toggleable(isToggledHiddenByDefault: false),
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
