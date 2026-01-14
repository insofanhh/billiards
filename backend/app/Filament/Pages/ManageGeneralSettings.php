<?php

namespace App\Filament\Pages;

use App\Settings\GeneralSettings;
use BackedEnum;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Pages\SettingsPage;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;
use UnitEnum;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Config;

class ManageGeneralSettings extends SettingsPage
{
    protected static string $settings = GeneralSettings::class;

    protected static BackedEnum | string | null $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static string|UnitEnum|null $navigationGroup = 'Quản lý hệ thống';

    protected static ?int $navigationSort = 2;

    protected static ?string $title = 'Cài đặt chung';




    public function form(Schema $schema): Schema
    {
        return parent::form($schema)->components([
            Section::make('Cấu hình Email (SMTP)')
                ->description('Cấu hình gửi mail hệ thống.')
                ->schema([
                    TextInput::make('mail_host')
                        ->label('Mail Host')
                        ->placeholder('smtp.gmail.com')
                        ->required(),
                    TextInput::make('mail_port')
                        ->label('Mail Port')
                        ->placeholder('587')
                        ->required(),
                    TextInput::make('mail_username')
                        ->label('Username')
                        ->required(),
                    TextInput::make('mail_password')
                        ->label('Password')
                        ->password()
                        ->revealable()
                        ->required(),
                    TextInput::make('mail_from_address')
                        ->label('From Address')
                        ->email()
                        ->required(),
                    TextInput::make('mail_from_name')
                        ->label('From Name')
                        ->required(),
                ])->columns(2),
            Section::make('Banner & Giao diện')
                ->schema([
                    FileUpload::make('image_banner')
                        ->label('Ảnh bìa (Banners)')
                        ->image()
                        ->multiple()
                        ->imageEditor()
                        ->reorderable()
                        ->directory('banners')
                        ->preserveFilenames()
                        ->helperText('Upload nhiều ảnh để hiển thị dạng slider trên trang khách.'),
                    TextInput::make('banner_video_url')
                        ->label('Youtube Video URL')
                        ->url()
                        ->placeholder('https://www.youtube.com/watch?v=...')
                        ->helperText('Nhập link Youtube. Nếu có video, slider ảnh sẽ bị tắt và hiển thị video nền.'),
                ]),
            Section::make('Thông báo hệ thống')
                ->schema([
                    Toggle::make('is_notification_active')
                        ->label('Bật thông báo')
                        ->helperText('Bật để hiển thị thông báo nổi bật cho khách hàng.'),
                    Textarea::make('notification_content')
                        ->label('Nội dung thông báo chính')
                        ->rows(4)
                        ->visible(fn (Get $get): bool => (bool) $get('is_notification_active'))
                        ->helperText('Nội dung hiển thị khi thông báo được bật.'),
                    Repeater::make('extra_notifications')
                        ->label('Các thông báo mở rộng')
                        ->schema([
                            TextInput::make('title')
                                ->label('Tiêu đề')
                                ->required()
                                ->maxLength(255),
                            TextInput::make('link')
                                ->label('Đường dẫn')
                                ->url()
                                ->nullable()
                                ->helperText('Tùy chọn: liên kết khi người dùng nhấp vào.'),
                        ])
                        ->reorderable()
                        ->collapsible()
                        ->itemLabel(fn (array $state): ?string => $state['title'] ?? null),
                ]),
            Section::make('Cấu hình Báo cáo')
                 ->schema([
                    TextInput::make('daily_report_email')
                        ->label('Email nhận báo cáo ngày')
                        ->email()
                        ->placeholder('example@email.com')
                        ->helperText('Báo cáo doanh thu hàng ngày sẽ được gửi đến email này.'),
                 ])
                 ->columns(1),
        ]);
    }
}

