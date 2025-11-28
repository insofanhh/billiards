<?php

namespace App\Filament\Pages;

use Filament\Forms\Components\DatePicker;
use Filament\Pages\Dashboard as BaseDashboard;
use Filament\Pages\Dashboard\Concerns\HasFiltersForm;
use Filament\Schemas\Components\Component;
use Filament\Schemas\Components\EmbeddedSchema;
use Filament\Schemas\Schema;
use Illuminate\Support\Carbon;

class Dashboard extends BaseDashboard
{
    use HasFiltersForm;

    /**
     * Change the navigation label (sidebar menu name).
     * * @var string|null
     */
    protected static ?string $navigationLabel = 'Tổng quan';

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-home';


    public function getTitle(): string
    {
        return 'Tổng quan - ' . $this->getSelectedDate()->format('d/m/Y');
    }

    public function filtersForm(Schema $schema): Schema
    {
        return $schema
            ->columns(['md' => 1])
            ->components([
                DatePicker::make('date')
                    ->label('Chọn ngày')
                    ->default(fn () => today('Asia/Ho_Chi_Minh'))
                    ->maxDate(today('Asia/Ho_Chi_Minh'))
                    ->displayFormat('d/m/Y'),
            ]);
    }

    public function content(Schema $schema): Schema
    {
        return $schema
            ->components([
                $this->getFiltersFormContentComponent(),
                $this->getWidgetsContentComponent(),
            ]);
    }

    public function getFiltersFormContentComponent(): Component
    {
        return EmbeddedSchema::make('filtersForm')
            ->extraAttributes([
                'class' => 'dashboard-filter-header',
                'style' => 'position: relative; float: right; margin-top: -4rem; margin-bottom: 1rem; width: 16rem; z-index: 10;',
            ]);
    }

    protected function getSelectedDate(): Carbon
    {
        $selected = data_get($this->filters, 'date');

        return $selected
            ? Carbon::parse($selected, 'Asia/Ho_Chi_Minh')
            : Carbon::now('Asia/Ho_Chi_Minh');
    }
}