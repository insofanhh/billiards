<?php

namespace App\Filament\Resources\Transactions\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class TransactionsTable
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
                TextColumn::make('user.name')
                    ->label('Khách hàng')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('amount')
                    ->label('Số tiền')
                    ->money('VND', locale: 'vi')
                    ->sortable()
                    ->alignEnd()
                    ->weight('bold'),
                TextColumn::make('method')
                    ->label('Phương thức')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'cash' => 'success',
                        'card' => 'info',
                        'mobile' => 'warning',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'cash' => 'Tiền mặt',
                        'card' => 'Thẻ',
                        'mobile' => 'Mobile banking',
                        default => $state,
                    })
                    ->sortable(),
                TextColumn::make('status')
                    ->label('Trạng thái')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'warning',
                        'success' => 'success',
                        'failed' => 'danger',
                        'refunded' => 'info',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'pending' => 'Chờ xử lý',
                        'success' => 'Thành công',
                        'failed' => 'Thất bại',
                        'refunded' => 'Đã hoàn tiền',
                        default => $state,
                    })
                    ->sortable(),
                TextColumn::make('reference')
                    ->label('Mã tham chiếu')
                    ->searchable()
                    ->copyable()
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Trạng thái')
                    ->options([
                        'pending' => 'Chờ xử lý',
                        'success' => 'Thành công',
                        'failed' => 'Thất bại',
                        'refunded' => 'Đã hoàn tiền',
                    ]),
                SelectFilter::make('method')
                    ->label('Phương thức')
                    ->options([
                        'cash' => 'Tiền mặt',
                        'card' => 'Thẻ',
                        'mobile' => 'Mobile banking',
                    ]),
            ])
            ->recordActions([
                ViewAction::make(),
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
