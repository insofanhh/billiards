<?php

namespace App\Filament\Resources\CategoryServices;

use App\Filament\Resources\CategoryServices\Pages\CreateCategoryService;
use App\Filament\Resources\CategoryServices\Pages\EditCategoryService;
use App\Filament\Resources\CategoryServices\Pages\ListCategoryServices;
use App\Filament\Resources\CategoryServices\Schemas\CategoryServiceForm;
use App\Filament\Resources\CategoryServices\Tables\CategoryServicesTable;
use App\Models\CategoryService;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class CategoryServiceResource extends Resource
{
    protected static ?string $model = CategoryService::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedTag;

    protected static string | UnitEnum | null $navigationGroup = 'Quản lý dịch vụ';
    protected static ?string $navigationLabel = 'Danh mục dịch vụ';
    protected static ?string $modelLabel = 'Danh mục dịch vụ';
    protected static ?string $pluralModelLabel = 'Danh mục dịch vụ';
    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return CategoryServiceForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CategoryServicesTable::configure($table);
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
            'index' => ListCategoryServices::route('/'),
            'create' => CreateCategoryService::route('/create'),
            'edit' => EditCategoryService::route('/{record}/edit'),
        ];
    }
}

