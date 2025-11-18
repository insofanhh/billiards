<?php

namespace App\Filament\Resources\ServiceInventories\Pages;

use App\Filament\Resources\ServiceInventories\ServiceInventoryResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditServiceInventory extends EditRecord
{
    protected static string $resource = ServiceInventoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}


