<?php

namespace App\Filament\Resources\TableBilliards\Pages;

use App\Filament\Resources\TableBilliards\TableBilliardResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditTableBilliard extends EditRecord
{
    protected static string $resource = TableBilliardResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
