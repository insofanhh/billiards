<?php

namespace App\Filament\Resources\Orders\Tables;

use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\ViewAction;
use Filament\Actions\DeleteAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\Filter;
use Filament\Forms\Components\DatePicker;
use Filament\Tables\Table;

class OrdersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('order_code')
                    ->label('Mã đơn')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->copyable(),
                TextColumn::make('user.name')
                    ->label('Khách hàng')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('table.name')
                    ->label('Bàn')
                    ->badge()
                    ->color('info'),
                TextColumn::make('status')
                    ->label('Trạng thái')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'warning',
                        'active' => 'success',
                        'completed' => 'gray',
                        'cancelled' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'pending' => 'Chờ xử lý',
                        'active' => 'Đang sử dụng',
                        'completed' => 'Hoàn thành',
                        'cancelled' => 'Đã hủy',
                        default => $state,
                    })
                    ->sortable(),
                TextColumn::make('start_at')
                    ->label('Bắt đầu')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
                TextColumn::make('end_at')
                    ->label('Kết thúc')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('total_play_time_minutes')
                    ->label('Thời gian')
                    ->formatStateUsing(fn ($state) => $state ? gmdate('H:i', $state * 60) : '-')
                    ->toggleable(),
                TextColumn::make('total_paid')
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
            ])
            ->filters([
                Filter::make('created_at')
                    ->label('Ngày tạo')
                    ->form([
                        DatePicker::make('created_from')
                            ->label('Từ ngày'),
                        DatePicker::make('created_until')
                            ->label('Đến ngày'),
                    ])
                    ->query(function ($query, array $data) {
                        return $query
                            ->when(
                                $data['created_from'],
                                fn ($query, $date) => $query->whereDate('created_at', '>=', $date),
                            )
                            ->when(
                                $data['created_until'],
                                fn ($query, $date) => $query->whereDate('created_at', '<=', $date),
                            );
                    }),
                SelectFilter::make('table_id')
                    ->label('Bàn')
                    ->relationship('table', 'name'),
                SelectFilter::make('user_id')
                    ->label('Khách hàng')
                    ->relationship('user', 'name'),
            ])
            ->recordActions([
                ViewAction::make(),
                Action::make('end_order')
                    ->label('Kết thúc')
                    ->icon('heroicon-o-stop')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn ($record) => $record->status === 'active')
                    ->action(function ($record) {
                        if ($record->status !== 'active') {
                            return;
                        }

                        $record->update([
                            'end_at' => now('Asia/Ho_Chi_Minh'),
                            'status' => 'completed',
                        ]);

                        $startTime = $record->start_at instanceof \Illuminate\Support\Carbon ? $record->start_at : \Illuminate\Support\Carbon::parse($record->start_at);
                        $endTime = $record->end_at instanceof \Illuminate\Support\Carbon ? $record->end_at : \Illuminate\Support\Carbon::parse($record->end_at);
                        $playTimeMinutes = $startTime->diffInMinutes($endTime);
                        
                        $hourlyPrice = (float) $record->priceRate->price_per_hour;
                        $perMinutePrice = $hourlyPrice / 60.0;
                        $tableCost = $playTimeMinutes * $perMinutePrice;
                        
                        $servicesCost = $record->items->sum('total_price');
                        $totalBeforeDiscount = $tableCost + $servicesCost;

                        $discount = 0;
                        if ($record->applied_discount_id) {
                            $discountCode = $record->appliedDiscount;
                            if ($discountCode && $discountCode->discount_type === 'percent') {
                                $discount = $totalBeforeDiscount * ($discountCode->discount_value / 100);
                            } elseif ($discountCode && $discountCode->discount_type === 'fixed') {
                                $discount = $discountCode->discount_value;
                            }
                        }

                        $totalPaid = $totalBeforeDiscount - $discount;

                        $record->update([
                            'total_play_time_minutes' => $playTimeMinutes,
                            'total_before_discount' => round($totalBeforeDiscount),
                            'total_discount' => round($discount),
                            'total_paid' => round($totalPaid),
                        ]);

                        $record->table->update(['status_id' => 1]);

                        \Filament\Notifications\Notification::make()
                            ->title('Thành công')
                            ->body("Đơn hàng đã được kết thúc. Tổng tiền: " . number_format($totalPaid, 0, ',', '.') . " ₫")
                            ->success()
                            ->send();
                    }),
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
