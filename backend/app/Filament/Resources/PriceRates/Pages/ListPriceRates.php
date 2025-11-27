<?php

namespace App\Filament\Resources\PriceRates\Pages;

use App\Filament\Resources\PriceRates\PriceRateResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPriceRates extends ListRecords
{
    protected static string $resource = PriceRateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()
                ->label('Thêm giá'),
        ];
    }
}
