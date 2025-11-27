<?php

namespace App\Filament\Resources\TableBilliards;

use App\Filament\Resources\TableBilliards\Pages\CreateTableBilliard;
use App\Filament\Resources\TableBilliards\Pages\EditTableBilliard;
use App\Filament\Resources\TableBilliards\Pages\ListTableBilliards;
use App\Filament\Resources\TableBilliards\Schemas\TableBilliardForm;
use App\Filament\Resources\TableBilliards\Tables\TableBilliardsTable;
use App\Models\TableBilliard;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class TableBilliardResource extends Resource
{
    protected static ?string $model = TableBilliard::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedTableCells;

    protected static string | UnitEnum | null $navigationGroup = 'Quản lý bàn';
    protected static ?string $navigationLabel = 'Bàn Billiards';
    protected static ?string $modelLabel = 'Bàn Billiards';
    protected static ?string $pluralModelLabel = 'Bàn Billiards';
    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return TableBilliardForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TableBilliardsTable::configure($table);
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
            'index' => ListTableBilliards::route('/'),
            'create' => CreateTableBilliard::route('/create'),
            'edit' => EditTableBilliard::route('/{record}/edit'),
        ];
    }
}
