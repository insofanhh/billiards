<?php

namespace App\Filament\Resources\PriceRates\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\ViewAction;
use Filament\Actions\DeleteAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class PriceRatesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('tableType.name')
                    ->label('Loại bàn')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('info'),
                TextColumn::make('price_per_hour')
                    ->label('Giá mỗi giờ')
                    ->money('VND', locale: 'vi')
                    ->sortable()
                    ->alignEnd()
                    ->weight('bold'),
                TextColumn::make('time_range')
                    ->label('Khoảng thời gian')
                    ->formatStateUsing(function ($record) {
                        $parts = [];
                        
                        $dayOfWeek = $record->day_of_week ?? null;
                        if ($dayOfWeek && is_array($dayOfWeek) && count($dayOfWeek) > 0) {
                            $dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                            $days = array_map(function($d) use ($dayNames) {
                                return $dayNames[$d] ?? $d;
                            }, $dayOfWeek);
                            $parts[] = implode(', ', $days);
                        } else {
                            $parts[] = 'Mọi ngày';
                        }
                        
                        $startTime = $record->start_time;
                        $endTime = $record->end_time;
                        
                        if ($startTime || $endTime) {
                            if ($startTime && $endTime) {
                                $startStr = is_string($startTime) ? substr($startTime, 0, 5) : (is_object($startTime) ? $startTime->format('H:i') : $startTime);
                                $endStr = is_string($endTime) ? substr($endTime, 0, 5) : (is_object($endTime) ? $endTime->format('H:i') : $endTime);
                                
                                if ($startStr && $endStr) {
                                    $parts[] = "{$startStr} - {$endStr}";
                                } elseif ($startStr) {
                                    $parts[] = "Từ {$startStr}";
                                } elseif ($endStr) {
                                    $parts[] = "Đến {$endStr}";
                                }
                            } elseif ($startTime) {
                                $startStr = is_string($startTime) ? substr($startTime, 0, 5) : (is_object($startTime) ? $startTime->format('H:i') : $startTime);
                                if ($startStr) {
                                    $parts[] = "Từ {$startStr}";
                                }
                            } elseif ($endTime) {
                                $endStr = is_string($endTime) ? substr($endTime, 0, 5) : (is_object($endTime) ? $endTime->format('H:i') : $endTime);
                                if ($endStr) {
                                    $parts[] = "Đến {$endStr}";
                                }
                            }
                        } else {
                            $parts[] = 'Cả ngày';
                        }
                        
                        return implode(' | ', $parts) ?: 'Mọi ngày | Cả ngày';
                    })
                    ->wrap()
                    ->searchable(false)
                    ->default('Mọi ngày | Cả ngày'),
                TextColumn::make('priority')
                    ->label('Ưu tiên')
                    ->sortable()
                    ->alignCenter()
                    ->badge()
                    ->color(fn ($state) => $state > 0 ? 'warning' : 'gray'),
                ToggleColumn::make('active')
                    ->label('Trạng thái'),
                TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('table_type_id')
                    ->label('Loại bàn')
                    ->relationship('tableType', 'name'),
                TernaryFilter::make('active')
                    ->label('Trạng thái')
                    ->placeholder('Tất cả')
                    ->trueLabel('Đang hoạt động')
                    ->falseLabel('Đã tắt'),
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
            ->defaultSort('table_type_id', 'asc');
    }
}
