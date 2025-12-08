<?php

namespace App\Filament\Resources\CategoryServices\Pages;

use App\Filament\Resources\CategoryServices\CategoryServiceResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditCategoryService extends EditRecord
{
    protected static string $resource = CategoryServiceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}

