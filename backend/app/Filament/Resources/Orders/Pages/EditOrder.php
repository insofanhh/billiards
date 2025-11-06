<?php

namespace App\Filament\Resources\Orders\Pages;

use App\Filament\Resources\Orders\OrderResource;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Carbon;
use Filament\Notifications\Notification;

class EditOrder extends EditRecord
{
    protected static string $resource = OrderResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('end_order')
                ->label('Kết thúc đơn hàng')
                ->icon('heroicon-o-stop')
                ->color('danger')
                ->requiresConfirmation()
                ->modalHeading('Kết thúc đơn hàng')
                ->modalDescription('Bạn có chắc chắn muốn kết thúc đơn hàng này? Hệ thống sẽ tính toán thời gian chơi và tổng tiền.')
                ->modalSubmitActionLabel('Xác nhận kết thúc')
                ->visible(fn () => $this->record->status === 'active')
                ->action(function () {
                    $record = $this->record;
                    
                    if ($record->status !== 'active') {
                        Notification::make()
                            ->title('Lỗi')
                            ->body('Chỉ có thể kết thúc đơn hàng đang hoạt động.')
                            ->danger()
                            ->send();
                        return;
                    }

                    $record->update([
                        'end_at' => Carbon::now('Asia/Ho_Chi_Minh'),
                        'status' => 'completed',
                    ]);

                    $startTime = $record->start_at instanceof Carbon ? $record->start_at : Carbon::parse($record->start_at);
                    $endTime = $record->end_at instanceof Carbon ? $record->end_at : Carbon::parse($record->end_at);
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

                    Notification::make()
                        ->title('Thành công')
                        ->body("Đơn hàng đã được kết thúc. Tổng tiền: " . number_format($totalPaid, 0, ',', '.') . " ₫")
                        ->success()
                        ->send();
                    
                    $this->redirect($this->getResource()::getUrl('edit', ['record' => $record]));
                }),
            DeleteAction::make(),
        ];
    }
}
