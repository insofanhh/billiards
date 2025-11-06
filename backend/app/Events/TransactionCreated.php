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

class TransactionCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Transaction $transaction
    ) {}

    public function broadcastOn(): array
    {
        $order = $this->transaction->order;
        return [
            new PrivateChannel('user.' . $order->user_id),
            new PrivateChannel('staff'),
            new Channel('orders'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'transaction.created';
    }

    public function broadcastWith(): array
    {
        $order = $this->transaction->order;
        return [
            'transaction' => [
                'id' => $this->transaction->id,
                'order_id' => $this->transaction->order_id,
                'status' => $this->transaction->status,
                'method' => $this->transaction->method,
                'amount' => $this->transaction->amount,
            ],
            'order' => [
                'id' => $order->id,
                'order_code' => $order->order_code,
                'table' => [
                    'id' => $order->table->id,
                    'code' => $order->table->code,
                    'name' => $order->table->name,
                ],
                'user_name' => $order->user->name,
            ],
        ];
    }
}

