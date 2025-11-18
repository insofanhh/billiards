<?php

namespace App\Filament\Resources\ServiceInventories;

use App\Filament\Resources\ServiceInventories\Pages\CreateServiceInventory;
use App\Filament\Resources\ServiceInventories\Pages\EditServiceInventory;
use App\Filament\Resources\ServiceInventories\Pages\ListServiceInventories;
use App\Filament\Resources\ServiceInventories\Schemas\ServiceInventoryForm;
use App\Filament\Resources\ServiceInventories\Tables\ServiceInventoriesTable;
use App\Models\ServiceInventory;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class ServiceInventoryResource extends Resource
{
    protected static ?string $model = ServiceInventory::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedInbox;

    protected static string|UnitEnum|null $navigationGroup = 'Quản lý dịch vụ';
    protected static ?string $navigationLabel = 'Kho dịch vụ';
    protected static ?string $modelLabel = 'Kho dịch vụ';
    protected static ?string $pluralModelLabel = 'Kho dịch vụ';

    public static function form(Schema $schema): Schema
    {
        return ServiceInventoryForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ServiceInventoriesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListServiceInventories::route('/'),
            'create' => CreateServiceInventory::route('/create'),
            'edit' => EditServiceInventory::route('/{record}/edit'),
        ];
    }
}


