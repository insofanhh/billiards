<?php

namespace App\Filament\Widgets;

use App\Models\Transaction;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class RevenueChart extends ChartWidget
{
    protected ?string $heading = 'Doanh thu theo ngày (7 ngày gần đây)';

    protected static ?int $sort = 3;

    protected function getData(): array
    {
        $data = [];
        $labels = [];
        
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now('Asia/Ho_Chi_Minh')->subDays($i);
            $startOfDay = $date->copy()->startOfDay();
            $endOfDay = $date->copy()->endOfDay();
            $labels[] = $date->format('d/m');
            $data[] = Transaction::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->where('status', 'success')
                ->sum('amount');
        }
        
        return [
            'datasets' => [
                [
                    'label' => 'Doanh thu (VND)',
                    'data' => $data,
                    'backgroundColor' => 'rgba(34, 197, 94, 0.5)',
                    'borderColor' => 'rgba(34, 197, 94, 1)',
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}

