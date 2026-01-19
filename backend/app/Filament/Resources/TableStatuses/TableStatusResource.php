<?php

namespace App\Filament\Resources\TableStatuses;

use App\Filament\Resources\TableStatuses\Pages\CreateTableStatus;
use App\Filament\Resources\TableStatuses\Pages\EditTableStatus;
use App\Filament\Resources\TableStatuses\Pages\ListTableStatuses;
use App\Filament\Resources\TableStatuses\Schemas\TableStatusForm;
use App\Filament\Resources\TableStatuses\Tables\TableStatusesTable;
use App\Models\TableStatus;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class TableStatusResource extends Resource
{
    protected static ?string $model = TableStatus::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCircleStack;

    protected static string|UnitEnum|null $navigationGroup = 'Quản lý bàn';
    protected static ?string $navigationLabel = 'Trạng thái bàn';
    protected static ?string $modelLabel = 'Trạng thái bàn';
    protected static ?string $pluralModelLabel = 'Trạng thái bàn';
    protected static bool $isScopedToTenant = false;
    protected static ?int $navigationSort = 4;

    public static function form(Schema $schema): Schema
    {
        return TableStatusForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TableStatusesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListTableStatuses::route('/'),
            'create' => CreateTableStatus::route('/create'),
            'edit' => EditTableStatus::route('/{record}/edit'),
        ];
    }
}
