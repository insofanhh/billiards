<?php

namespace App\Filament\Widgets;

use App\Models\OrderItem;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class ServicesSoldMonth extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 5;

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->heading('Dịch vụ bán tháng ' . $this->getSelectedDateLabel())
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
                    ->label('Doanh thu')
                    ->money('VND', locale: 'vi')
                    ->summarize(Tables\Columns\Summarizers\Sum::make()->money('VND', locale: 'vi')->label('Tổng'))
                    ->alignEnd(),
                Tables\Columns\TextColumn::make('total_profit')
                    ->label('Lợi nhuận')
                    ->money('VND', locale: 'vi')
                    ->summarize(Tables\Columns\Summarizers\Sum::make()->money('VND', locale: 'vi')->label('Tổng'))
                    ->alignEnd()
                    ->color(fn ($state): string => $state >= 0 ? 'success' : 'danger'),
            ])
            ->defaultKeySort(false)
            ->defaultPaginationPageOption(5)
            ->paginated([5, 10, 25])
            ->emptyStateHeading('Chưa có dịch vụ nào bán trong tháng ' . $this->getSelectedDateLabel());
    }

    protected function getTableQuery(): Builder
    {
        [$start, $end] = $this->getSelectedDateRange();

        // Subquery to calculate exact cost from transactions (handles split transactions)
        $costSubQuery = \App\Models\InventoryTransaction::query()
            ->select('reference_id')
            ->selectRaw('SUM(quantity_change * -1 * unit_cost) as item_cost')
            ->where('reference_type', \App\Models\OrderItem::class)
            ->groupBy('reference_id');

        return OrderItem::query()
            ->joinSub($costSubQuery, 'item_costs', function ($join) {
                $join->on('order_items.id', '=', 'item_costs.reference_id');
            }, null, null, 'left')
            ->join('service_inventories', 'order_items.service_id', '=', 'service_inventories.service_id', 'left')
            ->select('order_items.service_id')
            ->selectRaw('SUM(order_items.qty) as total_qty')
            ->selectRaw('SUM(order_items.total_price) as total_amount')
            ->selectRaw('MAX(order_items.id) as id')
            ->selectRaw('SUM(
                order_items.total_price - 
                COALESCE(item_costs.item_cost, service_inventories.average_cost * order_items.qty, 0)
            ) as total_profit')
            ->with('service')
            ->where('order_items.stock_deducted', true)
            ->whereBetween('order_items.updated_at', [$start, $end])
            ->groupBy('order_items.service_id')
            ->reorder()
            ->orderByDesc('total_qty')
            ->orderBy('order_items.service_id');
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    protected function getSelectedDateRange(): array
    {
        $date = data_get($this->pageFilters, 'date');
        $selectedDate = $date
            ? Carbon::parse($date, 'Asia/Ho_Chi_Minh')
            : Carbon::now('Asia/Ho_Chi_Minh');

        return [
            $selectedDate->copy()->startOfMonth(),
            $selectedDate->copy()->endOfMonth(),
        ];
    }

    protected function getSelectedDateLabel(): string
    {
        return $this->getSelectedDateRange()[0]->format('m/Y');
    }
}
