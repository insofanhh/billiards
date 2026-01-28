<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public \App\Models\Order $order
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->order->user_id),
            new PrivateChannel('staff'),
            new Channel('orders'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'order' => [
                'id' => $this->order->id,
                'order_code' => $this->order->order_code,
                'status' => $this->order->status,
                'total_before_discount' => $this->order->total_before_discount,
            ],
        ];
    }
}
