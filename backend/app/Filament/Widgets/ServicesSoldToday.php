<?php

namespace App\Filament\Widgets;

use App\Models\OrderItem;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class ServicesSoldToday extends BaseWidget
{
    protected static ?string $heading = 'Dịch vụ bán hôm nay';

    protected static ?int $sort = 4;

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query($this->getTableQuery())
            ->columns([
                Tables\Columns\TextColumn::make('service.name')
                    ->label('Dịch vụ')
                    ->searchable()
                    ->wrap()
                    ->weight('bold'),
                Tables\Columns\TextColumn::make('total_qty')
                    ->label('Số lượng')
                    ->alignEnd()
                    ->badge()
                    ->color(fn (int $state): string => $state === 0 ? 'gray' : ($state < 5 ? 'warning' : 'success')),
                Tables\Columns\TextColumn::make('total_amount')
                    ->label('Thành tiền')
                    ->money('VND', locale: 'vi')
                    ->alignEnd()
            ])
            ->defaultKeySort(false)
            ->defaultPaginationPageOption(5)
            ->paginated([5, 10, 25])
            ->emptyStateHeading('Chưa có dịch vụ nào bán hôm nay');
    }

    protected function getTableQuery(): Builder
    {
        $start = now('Asia/Ho_Chi_Minh')->startOfDay();
        $end = now('Asia/Ho_Chi_Minh')->endOfDay();

        return OrderItem::query()
            ->select('service_id')
            ->selectRaw('SUM(qty) as total_qty')
            ->selectRaw('SUM(total_price) as total_amount')
            ->selectRaw('MAX(id) as id')
            ->with('service')
            ->where('stock_deducted', true)
            ->whereBetween('updated_at', [$start, $end])
            ->groupBy('service_id')
            ->reorder()
            ->orderByDesc('total_qty')
            ->orderBy('service_id');
    }
}

