<?php

namespace App\Filament\Resources\TableTypes\Pages;

use App\Filament\Resources\TableTypes\TableTypeResource;
use Filament\Resources\Pages\CreateRecord;

class CreateTableType extends CreateRecord
{
    protected static string $resource = TableTypeResource::class;
}
