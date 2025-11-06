<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderRequested implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Order $order
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('orders'),
            new PrivateChannel('staff'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.requested';
    }

    public function broadcastWith(): array
    {
        return [
            'order' => [
                'id' => $this->order->id,
                'order_code' => $this->order->order_code,
                'table_id' => $this->order->table_id,
                'table' => [
                    'id' => $this->order->table->id,
                    'code' => $this->order->table->code,
                    'name' => $this->order->table->name,
                ],
                'user_id' => $this->order->user_id,
                'user_name' => $this->order->user->name,
                'status' => $this->order->status,
            ],
        ];
    }
}

