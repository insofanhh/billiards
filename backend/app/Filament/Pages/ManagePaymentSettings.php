<?php

namespace App\Filament\Pages;

use App\Models\Store;
use BackedEnum;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Livewire\Attributes\Locked;
use UnitEnum;

class ManagePaymentSettings extends Page
{

    protected static BackedEnum | string | null $navigationIcon = 'heroicon-o-credit-card';

    protected static string | UnitEnum | null $navigationGroup = 'Quản lý hệ thống';

    protected static ?int $navigationSort = 4;

    protected static ?string $title = 'Cấu hình thanh toán';

    public ?array $data = [];

    public function mount(): void
    {
        $store = $this->getStore();

        if ($store) {
            $this->data = [
                'bank_account_no' => $store->bank_account_no,
                'bank_name' => $store->bank_name,
                'bank_account_name' => $store->bank_account_name,
                'sepay_api_key' => $store->sepay_api_key,
                'webhook_url' => $store->getWebhookUrl(),
            ];
        }
    }

    public function content(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Thông tin ngân hàng')
                ->description('Cấu hình tài khoản ngân hàng để nhận thanh toán từ khách hàng')
                ->schema([
                    TextInput::make('data.bank_name')
                        ->label('Tên ngân hàng')
                        ->placeholder('VD: TPBank, VCB, MB, Techcombank...')
                        ->maxLength(255)
                        ->helperText('Tên ngân hàng viết tắt (dùng để tạo QR code)'),

                    TextInput::make('data.bank_account_no')
                        ->label('Số tài khoản')
                        ->placeholder('VD: 12345678901')
                        ->numeric()
                        ->maxLength(20)
                        ->helperText('Số tài khoản ngân hàng nhận tiền'),

                    TextInput::make('data.bank_account_name')
                        ->label('Tên chủ tài khoản')
                        ->placeholder('VD: NGUYEN VAN A')
                        ->maxLength(255)
                        ->helperText('Tên người/công ty chủ tài khoản (tùy chọn)'),
                ])
                ->columns(1),

            Section::make('Cấu hình SePay')
                ->description('Cấu hình API Key và Webhook URL của SePay để tự động xác nhận thanh toán')
                ->schema([
                    TextInput::make('data.sepay_api_key')
                        ->label('SePay API Key')
                        ->placeholder('Nhập API Key từ tài khoản SePay')
                        ->password()
                        ->revealable()
                        ->maxLength(255)
                        ->helperText('API Key từ tài khoản SePay của bạn (đăng nhập sepay.vn để lấy)'),

                    Textarea::make('data.webhook_url')
                        ->label('Webhook URL')
                        ->disabled()
                        ->rows(3)
                        ->helperText('Copy URL này và paste vào phần cấu hình Webhook trên trang sepay.vn')
                        ->extraAttributes([
                            'class' => 'font-mono text-sm',
                        ]),
                ])
                ->columns(1),
                
            \Filament\Schemas\Components\Actions::make($this->getFormActions())
                ->fullWidth(),
        ]);
    }

    protected function getFormActions(): array
    {
        return [
            \Filament\Actions\Action::make('save')
                ->label('Lưu cấu hình')
                ->color('primary')
                ->icon('heroicon-o-check')
                ->size('lg')
                ->requiresConfirmation()
                ->modalHeading('Xác nhận lưu cấu hình')
                ->modalDescription('Bạn có chắc chắn muốn lưu các thông tin thanh toán này?')
                ->modalSubmitActionLabel('Lưu')
                ->action(fn () => $this->save()),
        ];
    }

    public function save(): void
    {
        try {
            if (empty($this->data['bank_account_no']) || empty($this->data['bank_name']) || empty($this->data['sepay_api_key'])) {
                Notification::make()
                    ->title('Vui lòng điền đầy đủ thông tin')
                    ->body('Tên ngân hàng, số tài khoản và SePay API Key là bắt buộc')
                    ->danger()
                    ->send();
                return;
            }

            $store = $this->getStore();

            if (!$store) {
                Notification::make()
                    ->title('Không tìm thấy store')
                    ->danger()
                    ->send();
                return;
            }

            DB::transaction(function () use ($store) {
                $store->update([
                    'bank_account_no' => $this->data['bank_account_no'],
                    'bank_name' => $this->data['bank_name'],
                    'bank_account_name' => $this->data['bank_account_name'] ?? null,
                    'sepay_api_key' => $this->data['sepay_api_key'],
                ]);
            });

            Notification::make()
                ->title('Đã lưu cấu hình thanh toán')
                ->body('Thông tin thanh toán đã được cập nhật thành công')
                ->success()
                ->send();

            $this->data = [
                'bank_account_no' => $store->bank_account_no,
                'bank_name' => $store->bank_name,
                'bank_account_name' => $store->bank_account_name,
                'sepay_api_key' => $store->sepay_api_key,
                'webhook_url' => $store->getWebhookUrl(),
            ];

        } catch (\Exception $e) {
            Notification::make()
                ->title('Lỗi khi lưu cấu hình')
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    protected function getStore(): ?Store
    {
        if (app()->has('currentStoreId')) {
            return Store::find(app('currentStoreId'));
        }
        return null;
    }

    public static function getNavigationLabel(): string
    {
        return 'Cấu hình thanh toán';
    }

    public static function canAccess(): bool
    {
        return Auth::check();
    }
}
