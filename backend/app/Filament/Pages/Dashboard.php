<?php

namespace App\Filament\Pages;

use Filament\Forms\Components\DatePicker;
use Filament\Pages\Dashboard as BaseDashboard;
use Filament\Pages\Dashboard\Concerns\HasFiltersForm;
use Filament\Schemas\Components\Component;
use Filament\Schemas\Components\EmbeddedSchema;
use Filament\Schemas\Schema;
use Illuminate\Support\Carbon;
use Filament\Schemas\Components\Actions;
use Filament\Actions\Action;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use App\Models\Order;
use App\Models\Transaction;
use App\Models\OrderItem;
use Illuminate\Support\Facades\Response;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\View;

class Dashboard extends BaseDashboard
{
    use HasFiltersForm;

    /**
     * Change the navigation label (sidebar menu name).
     * * @var string|null
     */
    protected static ?string $navigationLabel = 'Tổng quan';

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-home';


    public function getTitle(): string
    {
        $user = auth()->user();
        return $user ? 'Chào mừng, '.$user->name.' !' : 'Tổng quan';
    }

    public function filtersForm(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make()
                    ->columnSpan('full')
                    ->compact()
                    ->schema([
                        Grid::make()
                            ->columns([
                                'default' => 1,
                                'lg' => 12,
                            ])
                            ->extraAttributes(['class' => 'gap-4'])
                            ->schema([
                                DatePicker::make('date')
                                    ->label('Chọn ngày')
                                    ->default(fn () => today('Asia/Ho_Chi_Minh'))
                                    ->maxDate(today('Asia/Ho_Chi_Minh'))
                                    ->displayFormat('d/m/Y')
                                    ->columnSpan([
                                        'default' => 1,
                                        'lg' => 3,
                                    ]),

                                Actions::make([
                                    Action::make('exportOrders')
                                        ->label('Xuất Đơn hàng')
                                        ->action('exportOrdersCsv')
                                        ->color('primary'),

                                    Action::make('exportTransactions')
                                        ->label('Xuất Giao dịch')
                                        ->action('exportTransactionsCsv')
                                        ->color('success'),

                                    Action::make('exportServices')
                                        ->label('Xuất Dịch vụ')
                                        ->action('exportServicesCsv')
                                        ->color('warning'),
                                ])
                                ->alignEnd()
                                ->columnSpan([
                                    'default' => 1,
                                    'lg' => 9,
                                ])
                                ->extraAttributes([
                                    'class' => '!mt-[20px]', 
                                ]),
                            ]),
                    ]),
            ])
            ->columns(1);
    }

    public function content(Schema $schema): Schema
    {
        return $schema
            ->components([
                $this->getFiltersFormContentComponent(),
                $this->getWidgetsContentComponent(),
                View::make('filament.pages.dashboard-chat'),
            ]);
    }

    public function getFiltersFormContentComponent(): Component
    {
        return EmbeddedSchema::make('filtersForm')
            ->extraAttributes([
                'class' => 'dashboard-filter-header',
                'style' => 'position: relative; float: right; margin-top: -4rem; margin-bottom: 1rem; width: 100%; z-index: 10;',
            ]);
    }

    protected function getSelectedDate(): Carbon
    {
        $selected = data_get($this->filters, 'date');

        return $selected
            ? Carbon::parse($selected, 'Asia/Ho_Chi_Minh')
            : Carbon::now('Asia/Ho_Chi_Minh');
    }

    public function exportOrdersCsv()
    {
        $date = $this->getSelectedDate()->format('Y-m-d');
        $orders = Order::whereDate('created_at', $date)->get();

        $csvData = [];
        $csvData[] = ['ID', 'Mã đơn', 'Khách hàng', 'Bàn', 'Tổng tiền', 'Trạng thái', 'Ngày tạo'];

        foreach ($orders as $order) {
            $csvData[] = [
                $order->id,
                $order->order_code,
                $order->user->name ?? 'N/A',
                $order->table_id,
                $order->total_paid,
                $order->status,
                $order->created_at,
            ];
        }

        return $this->downloadCsv($csvData, "orders_{$date}.csv");
    }

    public function exportTransactionsCsv()
    {
        $date = $this->getSelectedDate()->format('Y-m-d');
        $transactions = Transaction::whereDate('created_at', $date)->get();

        $csvData = [];
        $csvData[] = ['ID', 'Mã đơn', 'Khách hàng', 'Số tiền', 'Phương thức', 'Trạng thái', 'Ngày tạo'];

        foreach ($transactions as $transaction) {
            $csvData[] = [
                $transaction->id,
                $transaction->order->order_code ?? 'N/A',
                $transaction->order->user->name ?? $transaction->customer_name ?? $transaction->user->name ?? 'N/A',
                $transaction->amount,
                $transaction->method,
                $transaction->status,
                $transaction->created_at->format('d/m/Y H:i:s'),
            ];
        }

        return $this->downloadCsv($csvData, "transactions_{$date}.csv");
    }

    public function exportServicesCsv()
    {
        $date = $this->getSelectedDate()->format('Y-m-d');
        
        $items = OrderItem::whereDate('created_at', $date)
            ->with(['service', 'service.inventory'])
            ->get()
            ->groupBy('service_id');

        $csvData = [];
        $csvData[] = ['ID Dịch vụ', 'Tên dịch vụ', 'Số lượng bán', 'Doanh thu', 'Tồn kho hiện tại'];

        foreach ($items as $serviceId => $group) {
            $firstItem = $group->first();
            $serviceName = $firstItem->service->name ?? 'Unknown';
            $totalQty = $group->sum('qty');
            $totalRevenue = $group->sum('total_price');
            $currentStock = $firstItem->service->inventory->quantity ?? 0;

            $csvData[] = [
                $serviceId,
                $serviceName,
                $totalQty,
                $totalRevenue,
                $currentStock,
            ];
        }

        return $this->downloadCsv($csvData, "services_{$date}.csv");
    }

    protected function downloadCsv(array $data, string $filename)
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($data) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            foreach ($data as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}