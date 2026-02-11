<?php

namespace App\Filament\Resources\ServiceInventories\RelationManagers;

use Filament\Actions\AssociateAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\DissociateAction;
use Filament\Actions\DissociateBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class TransactionsRelationManager extends RelationManager
{
    protected static string $relationship = 'transactions';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                //
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('created_at')
                    ->label('Thời gian')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
                TextColumn::make('type')
                    ->label('Loại')
                    ->badge()
                    ->colors([
                        'success' => 'import',
                        'danger' => 'sale',
                        'warning' => 'adjustment',
                        'info' => 'return',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'import' => 'Nhập hàng',
                        'sale' => 'Bán hàng',
                        'adjustment' => 'Điều chỉnh',
                        'return' => 'Trả hàng',
                        default => $state,
                    }),
                TextColumn::make('quantity_change')
                    ->label('Thay đổi')
                    ->numeric()
                    ->sortable()
                    ->color(fn (int $state): string => $state > 0 ? 'success' : 'danger')
                    ->formatStateUsing(fn (int $state): string => ($state > 0 ? '+' : '') . $state),
                TextColumn::make('new_quantity_snapshot')
                    ->label('Tồn sau GD')
                    ->numeric(),
                TextColumn::make('unit_cost')
                    ->label('Giá vốn lúc GD')
                    ->money('VND')
                    ->sortable(),
                TextColumn::make('note')
                    ->label('Ghi chú')
                    ->limit(50)
                    ->tooltip(function (TextColumn $column): ?string {
                        return $column->getState();
                    }),
                TextColumn::make('user.name')
                    ->label('Người thực hiện')
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                //
            ])
            ->actions([
                //
            ])
            ->bulkActions([
                //
            ])
            ->defaultSort('created_at', 'desc');
    }
}
