<?php

namespace App\Filament\Resources\TableTypes\Pages;

use App\Filament\Resources\TableTypes\TableTypeResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListTableTypes extends ListRecords
{
    protected static string $resource = TableTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
