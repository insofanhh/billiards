<?php

namespace App\Filament\Resources\OrderStatuses\Pages;

use App\Filament\Resources\OrderStatuses\OrderStatusResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListOrderStatuses extends ListRecords
{
    protected static string $resource = OrderStatusResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
