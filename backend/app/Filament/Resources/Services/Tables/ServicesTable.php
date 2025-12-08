<?php

namespace App\Filament\Resources\Services\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\ViewAction;
use Filament\Actions\DeleteAction;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class ServicesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('image')
                    ->label('Ảnh')
                    ->disk('public')
                    ->circular()
                    ->toggleable(),
                TextColumn::make('name')
                    ->label('Tên dịch vụ')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('categoryService.name')
                    ->label('Danh mục')
                    ->sortable()
                    ->searchable(),
                TextColumn::make('description')
                    ->label('Mô tả')
                    ->limit(50)
                    ->toggleable(),
                TextColumn::make('price')
                    ->label('Giá')
                    ->money('VND', locale: 'vi')
                    ->sortable()
                    ->alignEnd(),
                TextColumn::make('charge_type')
                    ->label('Loại tính phí')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'per_unit' => 'info',
                        'one_time' => 'warning',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'per_unit' => 'Theo đơn vị',
                        'one_time' => 'Một lần',
                        default => $state,
                    })
                    ->sortable(),
                TextColumn::make('available_quantity')
                    ->label('Tồn kho')
                    ->sortable()
                    ->alignCenter()
                    ->badge()
                    ->color(fn (?int $state): string => match (true) {
                        $state === null => 'gray',
                        $state === 0 => 'danger',
                        $state < 5 => 'warning',
                        default => 'success',
                    })
                    ->formatStateUsing(fn (?int $state): string => (string) ($state ?? 0)),
                ToggleColumn::make('active')
                    ->label('Trạng thái'),
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
                TernaryFilter::make('active')
                    ->label('Trạng thái')
                    ->placeholder('Tất cả')
                    ->trueLabel('Đang hoạt động')
                    ->falseLabel('Đã tắt'),
                SelectFilter::make('charge_type')
                    ->label('Loại tính phí')
                    ->options([
                        'per_unit' => 'Theo đơn vị',
                        'one_time' => 'Một lần',
                    ]),
                SelectFilter::make('category_service_id')
                    ->label('Danh mục')
                    ->relationship('categoryService', 'name'),
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
            ->defaultSort('name', 'asc');
    }
}
