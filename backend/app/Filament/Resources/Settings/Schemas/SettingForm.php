<?php

namespace App\Filament\Resources\Settings\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Schemas\Schema;

class SettingForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(1)
            ->components([
                FileUpload::make('image_banner')
                    ->label('Ảnh banner')
                    ->image()
                    ->multiple()
                    ->reorderable()
                    ->disk('public')
                    ->directory('settings/banners')
                    ->visibility('public')
                    ->maxFiles(5)
                    ->preserveFilenames()
                    ->helperText('Tải lên tối đa 5 ảnh banner (nên dùng tỷ lệ 16:9).')
                    ->columnSpanFull(),
            ]);
    }
}

