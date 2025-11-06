<?php

namespace App\Filament\Resources\OrderStatuses\Pages;

use App\Filament\Resources\OrderStatuses\OrderStatusResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditOrderStatus extends EditRecord
{
    protected static string $resource = OrderStatusResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
