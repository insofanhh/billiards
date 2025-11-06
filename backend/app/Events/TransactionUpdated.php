<?php

namespace App\Events;

use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransactionUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Transaction $transaction,
        public Order $order
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("order.{$this->order->id}"),
            new Channel('orders'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'transaction' => [
                'id' => $this->transaction->id,
                'order_id' => $this->transaction->order_id,
                'status' => $this->transaction->status,
                'method' => $this->transaction->method,
                'amount' => $this->transaction->amount,
            ],
            'order_id' => $this->order->id,
        ];
    }

    public function broadcastAs(): string
    {
        return 'transaction.updated';
    }
}
