<?php

namespace App\Filament\Resources\CategoryServices\Pages;

use App\Filament\Resources\CategoryServices\CategoryServiceResource;
use Filament\Resources\Pages\CreateRecord;

class CreateCategoryService extends CreateRecord
{
    protected static string $resource = CategoryServiceResource::class;
}

