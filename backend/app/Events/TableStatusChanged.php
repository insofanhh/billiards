<?php

namespace App\Events;

use App\Http\Resources\TableResource;
use App\Models\TableBilliard;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TableStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public TableBilliard $table
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('tables'),
            new Channel("table.{$this->table->id}"),
        ];
    }

    public function broadcastWith(): array
    {
        return (new TableResource($this->table->load(['status', 'tableType'])))->toArray(request());
    }

    public function broadcastAs(): string
    {
        return 'table.status.changed';
    }
}
