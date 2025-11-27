<?php

namespace App\Filament\Resources\TableBilliards\Pages;

use App\Filament\Resources\TableBilliards\TableBilliardResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListTableBilliards extends ListRecords
{
    protected static string $resource = TableBilliardResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()
                ->label('Thêm bàn Billiards'),
        ];
    }
}
