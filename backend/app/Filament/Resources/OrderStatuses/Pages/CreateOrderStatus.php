<?php

namespace App\Filament\Resources\OrderStatuses\Pages;

use App\Filament\Resources\OrderStatuses\OrderStatusResource;
use Filament\Resources\Pages\CreateRecord;

class CreateOrderStatus extends CreateRecord
{
    protected static string $resource = OrderStatusResource::class;
}
