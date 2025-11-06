<?php

namespace App\Filament\Resources\TableTypes\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class TableTypesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('Tên loại bàn')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('description')
                    ->label('Mô tả')
                    ->limit(50)
                    ->toggleable(),
                TextColumn::make('priceRates_count')
                    ->label('Số bảng giá')
                    ->counts('priceRates')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('name', 'asc');
    }
}
