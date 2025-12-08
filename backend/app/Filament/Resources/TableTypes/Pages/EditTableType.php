<?php

namespace App\Filament\Resources\TableTypes\Pages;

use App\Filament\Resources\TableTypes\TableTypeResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditTableType extends EditRecord
{
    protected static string $resource = TableTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
