<?php

namespace App\Events;

use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Order $order
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('orders'),
            new Channel("order.{$this->order->id}"),
        ];
    }

    public function broadcastWith(): array
    {
        return (new OrderResource($this->order->load(['table', 'priceRate', 'items.service', 'transactions', 'appliedDiscount'])))->toArray(request());
    }

    public function broadcastAs(): string
    {
        return 'order.updated';
    }
}
