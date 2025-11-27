<?php

namespace App\Filament\Resources\ServiceInventories\Pages;

use App\Filament\Resources\ServiceInventories\ServiceInventoryResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListServiceInventories extends ListRecords
{
    protected static string $resource = ServiceInventoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()
                ->label('Thêm kho dịch vụ'),
        ];
    }
}


