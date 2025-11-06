<?php

namespace App\Filament\Widgets;

use App\Models\Order;
use App\Models\TableBilliard;
use App\Models\Transaction;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Number;

class StatsOverview extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        $todayStart = now('Asia/Ho_Chi_Minh')->startOfDay();
        $todayEnd = now('Asia/Ho_Chi_Minh')->endOfDay();
        
        $todayRevenue = Transaction::whereBetween('created_at', [$todayStart, $todayEnd])
            ->where('status', 'success')
            ->sum('amount');
        
        $todayOrders = Order::whereBetween('created_at', [$todayStart, $todayEnd])->count();
        
        $activeTables = TableBilliard::whereHas('status', fn($q) => $q->where('name', 'Đang sử dụng'))->count();
        
        $totalCustomers = User::role('customer')->count();
        
        return [
            Stat::make('Doanh thu hôm nay', Number::currency($todayRevenue, 'VND', 'vi'))
                ->description('Tổng doanh thu từ các giao dịch thành công')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('success')
                ->chart([7, 3, 4, 5, 6, 3, 5]),
            
            Stat::make('Đơn hàng hôm nay', $todayOrders)
                ->description('Số đơn hàng được tạo hôm nay')
                ->descriptionIcon('heroicon-m-shopping-bag')
                ->color('info'),
            
            Stat::make('Bàn đang sử dụng', $activeTables)
                ->description('Số bàn hiện đang được sử dụng')
                ->descriptionIcon('heroicon-m-table-cells')
                ->color('warning'),
            
            Stat::make('Tổng khách hàng', $totalCustomers)
                ->description('Tổng số khách hàng đã đăng ký')
                ->descriptionIcon('heroicon-m-users')
                ->color('primary'),
        ];
    }
}
