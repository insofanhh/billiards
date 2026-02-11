<?php

namespace App\Filament\Resources\ServiceInventories\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;

class ServiceInventoriesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('service.name')
                    ->label('Dịch vụ')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('quantity')
                    ->label('Số lượng')
                    ->sortable()
                    ->alignEnd()
                    ->badge()
                    ->color(fn (?int $state): string => match (true) {
                        $state === null => 'gray',
                        $state === 0 => 'danger',
                        $state < 5 => 'warning',
                        default => 'success',
                    })
                    ->formatStateUsing(fn (?int $state): string => (string) ($state ?? 0)),
                TextColumn::make('average_cost')
                    ->label('Giá vốn TB')
                    ->money('VND')
                    ->sortable()
                    ->alignEnd(),
                TextColumn::make('updated_at')
                    ->label('Cập nhật')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->recordActions([
                ViewAction::make(),
                \Filament\Actions\Action::make('adjustment')
                    ->label('Điều chỉnh')
                    ->icon('heroicon-o-adjustments-horizontal')
                    ->color('warning')
                    ->form([
                        \Filament\Forms\Components\Select::make('type')
                            ->label('Loại điều chỉnh')
                            ->options([
                                'increase' => 'Nhập thêm / Điều chỉnh tăng (+)',
                                'decrease' => 'Xuất hủy / Điều chỉnh giảm (-)',
                            ])
                            ->default('increase')
                            ->required()
                            ->reactive(),
                        \Filament\Forms\Components\TextInput::make('quantity')
                            ->label('Số lượng')
                            ->numeric()
                            ->minValue(1)
                            ->required(),
                        \Filament\Forms\Components\TextInput::make('unit_cost')
                            ->label('Giá vốn (VNĐ)')
                            ->numeric()
                            ->suffix('VNĐ')
                            ->visible(fn ($get) => $get('type') === 'increase')
                            ->placeholder(fn ($record) => $record->average_cost)
                            ->helperText('Để trống sẽ dùng giá vốn trung bình hiện tại'),
                        \Filament\Forms\Components\Textarea::make('note')
                            ->label('Lý do')
                            ->required(),
                    ])
                    ->action(function (\App\Models\ServiceInventory $record, array $data) {
                        $inventoryService = app(\App\Services\InventoryService::class);
                        try {
                            if ($data['type'] === 'increase') {
                                $cost = $data['unit_cost'] ?? $record->average_cost;
                                $inventoryService->increaseStock(
                                    $record->service,
                                    $data['quantity'],
                                    (float) $cost,
                                    $record,
                                    'adjustment',
                                    $data['note']
                                );
                            } else {
                                $inventoryService->decreaseStock(
                                    $record->service,
                                    $data['quantity'],
                                    $record,
                                    'adjustment',
                                    $data['note']
                                );
                            }
                            
                            \Filament\Notifications\Notification::make()
                                ->title('Đã điều chỉnh kho thành công')
                                ->success()
                                ->send();
                        } catch (\Exception $e) {
                            \Filament\Notifications\Notification::make()
                                ->title('Lỗi khi điều chỉnh kho')
                                ->body($e->getMessage())
                                ->danger()
                                ->send();
                        }
                    }),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('quantity', 'desc');
    }
}

