<?php

namespace App\Events;

use App\Models\Transaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransactionConfirmed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Transaction $transaction
    ) {}

    public function broadcastOn(): array
    {
        $order = $this->transaction->order;
        $channels = [new Channel('orders')];

        if ($order->user_id) {
            $channels[] = new PrivateChannel('user.' . $order->user_id);
        }

        if ($this->transaction->user_id && $order->user_id !== $this->transaction->user_id) {
            $channels[] = new PrivateChannel('user.' . $this->transaction->user_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'transaction.confirmed';
    }

    public function broadcastWith(): array
    {
        $order = $this->transaction->order;
        $transaction = $this->transaction->fresh(['user']);

        return [
            'transaction' => [
                'id' => $transaction->id,
                'order_id' => $transaction->order_id,
                'status' => $transaction->status,
                'method' => $transaction->method,
                'amount' => $transaction->amount,
                'customer_name' => $transaction->customer_name,
                'staff_name' => $transaction->user?->name,
            ],
            'order' => [
                'id' => $order->id,
                'status' => $order->status,
                'total_paid' => $order->total_paid,
            ],
        ];
    }
}

