<?php

namespace App\Filament\Resources\CategoryServices\Pages;

use App\Filament\Resources\CategoryServices\CategoryServiceResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCategoryServices extends ListRecords
{
    protected static string $resource = CategoryServiceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()
                ->label('Thêm danh mục dịch vụ'),
        ];
    }
}

