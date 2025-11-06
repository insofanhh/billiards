<?php

namespace App\Filament\Resources\PriceRates\Pages;

use App\Filament\Resources\PriceRates\PriceRateResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPriceRate extends EditRecord
{
    protected static string $resource = PriceRateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
