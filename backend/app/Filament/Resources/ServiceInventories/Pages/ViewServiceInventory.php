<?php

namespace App\Filament\Resources\ServiceInventories\Pages;

use App\Filament\Resources\ServiceInventories\ServiceInventoryResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewServiceInventory extends ViewRecord
{
    protected static string $resource = ServiceInventoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
