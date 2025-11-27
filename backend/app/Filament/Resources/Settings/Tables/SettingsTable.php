<?php

namespace App\Filament\Resources\Settings\Tables;

use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class SettingsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('id')
                    ->label('ID')
                    ->sortable()
                    ->width('80px'),
                TextColumn::make('image_banner')
                    ->label('Số ảnh banner')
                    ->formatStateUsing(function ($state): string {
                        if (is_string($state)) {
                            try {
                                $state = json_decode($state, true, flags: JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE);
                            } catch (\JsonException) {
                                $state = [];
                            }
                        }

                        $files = is_array($state) ? array_filter($state, fn ($item) => filled($item)) : [];

                        return count($files) > 0 ? count($files) . ' ảnh' : 'Chưa có';
                    })
                    ->badge(),
                TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
                TextColumn::make('updated_at')
                    ->label('Cập nhật')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->defaultSort('id', 'desc');
    }
}

