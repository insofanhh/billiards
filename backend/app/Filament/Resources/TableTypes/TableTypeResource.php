<?php

namespace App\Filament\Resources\TableTypes;

use App\Filament\Resources\TableTypes\Pages\CreateTableType;
use App\Filament\Resources\TableTypes\Pages\EditTableType;
use App\Filament\Resources\TableTypes\Pages\ListTableTypes;
use App\Filament\Resources\TableTypes\Schemas\TableTypeForm;
use App\Filament\Resources\TableTypes\Tables\TableTypesTable;
use App\Models\TableType;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class TableTypeResource extends Resource
{
    protected static ?string $model = TableType::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedTag;

    protected static string|UnitEnum|null $navigationGroup = 'Quản lý bàn';
    protected static ?string $navigationLabel = 'Loại bàn';
    protected static ?string $modelLabel = 'Loại bàn';
    protected static ?string $pluralModelLabel = 'Loại bàn';
    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return TableTypeForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TableTypesTable::configure($table);
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
            'index' => ListTableTypes::route('/'),
            'create' => CreateTableType::route('/create'),
            'edit' => EditTableType::route('/{record}/edit'),
        ];
    }
}
