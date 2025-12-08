<?php

namespace App\Filament\Widgets;

use App\Models\OrderItem;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class ServicesSoldToday extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 4;

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->heading('Dịch vụ bán ' . $this->getSelectedDateLabel())
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
            ->emptyStateHeading('Chưa có dịch vụ nào bán ' . $this->getSelectedDateLabel());
    }

    protected function getTableQuery(): Builder
    {
        [$start, $end] = $this->getSelectedDateRange();

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
            $selectedDate->copy()->startOfDay(),
            $selectedDate->copy()->endOfDay(),
        ];
    }

    protected function getSelectedDateLabel(): string
    {
        return $this->getSelectedDateRange()[0]->format('d/m/Y');
    }
}

