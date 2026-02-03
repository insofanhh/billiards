<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

use App\Events\OrderRequested;
use App\Events\OrderEndRequested;
use App\Events\OrderServiceAdded;
use App\Events\TransactionCreated;
use App\Events\TransactionConfirmed;
use App\Events\NotificationCreated;
use App\Models\StoreNotification;
use Illuminate\Events\Dispatcher;

class SaveStoreNotification
{
    public function subscribe(Dispatcher $events): array
    {
        return [
            OrderRequested::class => 'handleOrderRequested',
            OrderEndRequested::class => 'handleOrderEndRequested',
            OrderServiceAdded::class => 'handleOrderServiceAdded',
            TransactionCreated::class => 'handleTransactionCreated',
            TransactionConfirmed::class => 'handleTransactionConfirmed',
        ];
    }

    public function handleOrderRequested(OrderRequested $event)
    {
        $order = $event->order;
        $order->load('table');

        // Deduplication
        if ($this->checkDuplicate($order->store_id, 'request', $order->id, 'request_open')) {
            return;
        }

        $tableName = $order->table->name ?? '?';
        $title = \Illuminate\Support\Str::startsWith($tableName, 'Bàn') ? $tableName : "Bàn $tableName";

        $this->createNotification(
            $order->store_id,
            'request',
            $title,
            "Có yêu cầu mở bàn mới!",
            [
                'order_id' => $order->id,
                'table_id' => $order->table_id,
                'event_type' => 'request_open'
            ]
        );
    }

    public function handleOrderEndRequested(OrderEndRequested $event)
    {
        $order = $event->order;
        $order->load('table');

        if ($this->checkDuplicate($order->store_id, 'request', $order->id, 'request_end')) {
            return;
        }

        $tableName = $order->table->name ?? '?';
        $title = \Illuminate\Support\Str::startsWith($tableName, 'Bàn') ? $tableName : "Bàn $tableName";

        $this->createNotification(
            $order->store_id,
            'request',
            $title,
            "Có yêu cầu thanh toán/kết thúc",
            [
                'order_id' => $order->id,
                'table_id' => $order->table_id,
                'event_type' => 'request_end'
            ]
        );
    }

    public function handleOrderServiceAdded(OrderServiceAdded $event)
    {
        $order = $event->order;
        $order->load('table');

        if ($this->checkDuplicate($order->store_id, 'service', $order->id, 'service_added')) {
            return;
        }

        $tableName = $order->table->name ?? '?';
        $title = \Illuminate\Support\Str::startsWith($tableName, 'Bàn') ? $tableName : "Bàn $tableName";

        $this->createNotification(
            $order->store_id,
            'service', 
            $title,
            "Có yêu cầu gọi dịch vụ mới!",
            [
                'order_id' => $order->id,
                'table_id' => $order->table_id,
                'event_type' => 'service_added'
            ]
        );
    }

    protected function checkDuplicate($storeId, $type, $orderId, $eventType)
    {
        return StoreNotification::where('store_id', $storeId)
            ->where('type', $type)
            ->where('data->order_id', $orderId)
            ->where('data->event_type', $eventType)
            ->where('created_at', '>=', now()->subSeconds(5))
            ->exists();
    }


    public function handleTransactionCreated(TransactionCreated $event)
    {
        // ... (previous content remains mostly same, just updating context around it if needed, but the chunks need to be specific)
        // Since I'm appending a new method, I will add it after handleTransactionCreated.
        $transaction = $event->transaction;
        // Ensure relations loaded
        if (!$transaction->relationLoaded('order')) {
            $transaction->load('order.table');
        }

        // Fix: Do not notify if transaction is successful (Created by staff)
        // or if created by staff (redundant check but safe)
        if ($transaction->status === 'success') {
             return;
        }
        
        
        // Also check if user is staff (if logic allows pending for staff?)
        // Usually staff creates 'success' transaction. 
        // Logic: Only notify 'pending' transactions which are Requests from customers.
        if ($transaction->user && $this->userHasStaffRole($transaction->user)) {
             return;
        }


        $methodLabel = $transaction->method ? match($transaction->method) {
            'cash' => 'Tiền mặt',
            'transfer', 'bank_transfer', 'mobile' => 'Chuyển khoản',
            'card' => 'Thẻ',
            default => $transaction->method,
        } : '';

        $message = "Có yêu cầu thanh toán" . ($methodLabel ? " ({$methodLabel})" : "");

        // Deduplication/Update logic
        $existing = StoreNotification::where('store_id', $transaction->store_id)
            ->where('type', 'payment')
            ->where('data->transaction_id', $transaction->id) // JSON query
            ->whereNull('read_at')
            ->first();

        if ($existing) {
            $existing->update([
                'message' => $message,
                'updated_at' => now(),
            ]);
            event(new NotificationCreated($existing));
            return;
        }

        $tableName = $transaction->order->table->name ?? '?';
        $title = \Illuminate\Support\Str::startsWith($tableName, 'Bàn') ? $tableName : "Bàn $tableName";

        $this->createNotification(
            $transaction->store_id,
            'payment',
            $title,
            $message,
            [
                'transaction_id' => $transaction->id,
                'order_id' => $transaction->order_id,
                'table_id' => $transaction->order->table_id,
                'amount' => $transaction->amount,
            ]
        );
    }

    public function handleTransactionConfirmed(TransactionConfirmed $event)
    {
        $transaction = $event->transaction;
        
        // Only notify for transfer methods (SePay usually) if requested, or all?
        // User asked: "khi customer thanh toán chuyển khoản thành công"
        // Let's restrict to transfer/mobile/bank_transfer to match request precisely, 
        // OR allow all but differentiate message.
        // User's requested message: "Bàn {table} thanh toán thành công {amount} đồng!"
        // This message is generic enough for any payment, but let's check method.
        
        if (!$transaction->relationLoaded('order')) {
            $transaction->load('order.table');
        }

        // We only care about success (which TransactionConfirmed implies)
        if ($transaction->status !== 'success') {
            return;
        }

        $tableName = $transaction->order->table->name ?? '?';
        $title = \Illuminate\Support\Str::startsWith($tableName, 'Bàn') ? $tableName : "Bàn $tableName";
        
        $amountFormatted = number_format($transaction->amount, 0, ',', '.');
        $message = "Bàn {$tableName} thanh toán thành công {$amountFormatted} đồng!";

        // Use a new type 'payment_success' to differentiate logic in frontend
        $this->createNotification(
            $transaction->store_id,
            'payment_success',
            $title,
            $message,
            [
                'transaction_id' => $transaction->id,
                'order_id' => $transaction->order_id,
                'table_id' => $transaction->order->table_id,
                'amount' => $transaction->amount,
                'amount_formatted' => $amountFormatted
            ]
        );
    }

    protected function createNotification($storeId, $type, $title, $message, $data = [])
    {
        $notification = StoreNotification::create([
            'store_id' => $storeId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        event(new NotificationCreated($notification));
    }

    protected function userHasStaffRole($user): bool
    {
        if (!$user) {
            return false;
        }
        if (!$user->relationLoaded('roles')) {
            $user->load('roles');
        }
        $roles = $user->roles->pluck('name')->map(fn ($role) => strtolower($role))->toArray();
        return !empty(array_intersect(['staff', 'admin', 'super_admin'], $roles));
    }
}
