<?php

namespace App\Filament\Widgets;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TableBilliard;
use App\Models\Transaction;
use App\Models\User;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Number;

class StatsOverview extends StatsOverviewWidget
{
    use InteractsWithPageFilters;

    protected function getStats(): array
    {
        [$dayStart, $dayEnd] = $this->getSelectedDateRange();

        $dateLabel = $dayStart->copy()->format('d/m/Y');

        $todayRevenue = Transaction::whereBetween('created_at', [$dayStart, $dayEnd])
            ->where('status', 'success')
            ->sum('amount');

        $todayServicesSold = OrderItem::whereBetween('updated_at', [$dayStart, $dayEnd])
            ->where('stock_deducted', true)
            ->sum('total_price');

        $todayTablesRevenue = Order::whereBetween('updated_at', [$dayStart, $dayEnd])
            ->sum('total_before_discount') - $todayServicesSold;

        $todayTablesRevenue = max($todayTablesRevenue, 0);
        
        $todayOrders = Order::whereBetween('created_at', [$dayStart, $dayEnd])->count();
        
        $activeTables = TableBilliard::whereHas('status', fn($q) => $q->where('name', 'Đang sử dụng'))->count();
        
        $totalCustomers = User::role('customer')->count();
        
        return [
            Stat::make("Tổng doanh thu {$dateLabel}", Number::currency($todayRevenue, 'VND', 'vi'))
                ->description('Tổng doanh thu từ bàn và dịch vụ trong ngày đã chọn')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('success')
                ->chart([7, 3, 4, 5, 6, 3, 5]),

            Stat::make("Doanh thu bàn {$dateLabel}", Number::currency($todayTablesRevenue, 'VND', 'vi'))
                ->description('Tổng doanh thu từ các bàn trong ngày đã chọn')
                ->descriptionIcon('heroicon-m-table-cells')
                ->color('warning')
                ->chart([7, 3, 4, 5, 6, 3, 5]),

            Stat::make("Doanh thu dịch vụ {$dateLabel}", Number::currency($todayServicesSold, 'VND', 'vi'))
                ->description('Tổng doanh thu từ các dịch vụ trong ngày đã chọn')
                ->descriptionIcon('heroicon-m-shopping-bag')
                ->color('info')
                ->chart([7, 3, 4, 5, 6, 3, 5]),
            
            Stat::make("Đơn hàng {$dateLabel}", $todayOrders)
                ->description('Số đơn hàng được tạo trong ngày đã chọn')
                ->descriptionIcon('heroicon-m-shopping-bag')
                ->color('info'),
            
            Stat::make('Bàn đang sử dụng', $activeTables)
                ->description('Số bàn hiện đang được sử dụng')
                ->descriptionIcon('heroicon-m-table-cells')
                ->color('warning'),
            
            Stat::make('Tổng người dùng', $totalCustomers)
                ->description('Tổng số người dùng đã đăng ký')
                ->descriptionIcon('heroicon-m-users')
                ->color('primary'),
        ];
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
}
