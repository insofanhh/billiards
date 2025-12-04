<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\Transaction;
use App\Models\OrderItem;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\DailyRevenueReportMail;

class SendDailyRevenueReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'report:daily-revenue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily revenue report email';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $date = Carbon::today('Asia/Ho_Chi_Minh')->format('Y-m-d');
        $startTime = Carbon::createFromFormat('Y-m-d H:i:s', "$date 00:00:00", 'Asia/Ho_Chi_Minh');
        $endTime = Carbon::createFromFormat('Y-m-d H:i:s', "$date 12:59:59", 'Asia/Ho_Chi_Minh');

        $orders = Order::whereBetween('created_at', [$startTime, $endTime])->get();
        $transactions = Transaction::whereBetween('created_at', [$startTime, $endTime])->get();
        
        $services = OrderItem::whereBetween('created_at', [$startTime, $endTime])
            ->with(['service', 'service.inventory'])
            ->get()
            ->groupBy('service_id');

        Mail::to('anhha2k2@gmail.com')->send(new DailyRevenueReportMail($orders, $transactions, $services, $date));

        $this->info('Daily revenue report sent successfully.');
    }
}
