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

class OrderEndApproved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Order $order
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->order->user_id),
            new Channel('orders'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.end.approved';
    }

    public function broadcastWith(): array
    {
        return [
            'order' => [
                'id' => $this->order->id,
                'status' => $this->order->status,
                'end_at' => $this->order->end_at,
                'total_play_time_minutes' => $this->order->total_play_time_minutes,
                'total_before_discount' => $this->order->total_before_discount,
                'total_discount' => $this->order->total_discount,
                'total_paid' => $this->order->total_paid,
            ],
        ];
    }
}

