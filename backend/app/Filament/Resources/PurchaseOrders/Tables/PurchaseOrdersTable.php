<?php

namespace App\Filament\Resources\PurchaseOrders\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class PurchaseOrdersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('store.name')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('creator.name')
                    ->label('Người tạo')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('supplier_name')
                    ->label('Nhà cung cấp')
                    ->searchable(),
                TextColumn::make('status')
                    ->label('Trạng thái')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'draft' => 'gray',
                        'ordered' => 'warning',
                        'completed' => 'success',
                        'cancelled' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'draft' => 'Nháp',
                        'ordered' => 'Đã đặt hàng',
                        'completed' => 'Đã nhập kho',
                        'cancelled' => 'Đã hủy',
                        default => $state,
                    })
                    ->searchable(),
                TextColumn::make('total_amount')
                    ->label('Tổng tiền')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('code')
                    ->label('Mã đơn hàng')
                    ->searchable(),
                TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->label('Ngày cập nhật')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                \Filament\Actions\Action::make('complete_order')
                    ->label('Hoàn thành')
                    ->button()
                    ->color('success')
                    ->icon('heroicon-o-check')
                    ->visible(fn (\App\Models\PurchaseOrder $record) => in_array($record->status, ['draft', 'ordered']))
                    ->requiresConfirmation()
                    ->action(function (\App\Models\PurchaseOrder $record) {
                        $inventoryService = app(\App\Services\InventoryService::class);
                        try {
                            \Illuminate\Support\Facades\DB::transaction(function () use ($record, $inventoryService) {
                                foreach ($record->items as $item) {
                                    $inventoryService->increaseStock(
                                        $item->service,
                                        $item->quantity,
                                        $item->unit_price, 
                                        $record, 
                                        'import',
                                        "Nhập hàng từ đơn {$record->code}"
                                    );
                                }
                                $record->update(['status' => 'completed']);
                            });
                            
                            \Filament\Notifications\Notification::make()
                                ->title('Đã nhập hàng thành công')
                                ->success()
                                ->send();
                        } catch (\Exception $e) {
                            \Filament\Notifications\Notification::make()
                                ->title('Lỗi khi nhập hàng')
                                ->body($e->getMessage())
                                ->danger()
                                ->send();
                        }
                    }),
                EditAction::make()
                    ->visible(fn (\App\Models\PurchaseOrder $record) => in_array($record->status, ['draft', 'ordered'])),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
