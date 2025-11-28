<?php

namespace App\Filament\Pages;

use Filament\Pages\Dashboard as BaseDashboard;

class Dashboard extends BaseDashboard
{
    /**
     * Change the navigation label (sidebar menu name).
     * * @var string|null
     */
    protected static ?string $navigationLabel = 'Tổng quan';

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-home';

    public function getTitle(): string
    {
        return 'Thống kê - ' . now()->format('d/m/Y');
    }
}