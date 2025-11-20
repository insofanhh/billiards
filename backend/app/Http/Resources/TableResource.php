<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\PriceRate;

class TableResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $pending = $this->orders()
            ->where('status', 'pending')
            ->latest()
            ->with('user')
            ->first();

        $pendingEnd = $this->orders()
            ->where('status', 'pending_end')
            ->latest()
            ->with('user')
            ->first();

        $pendingPaymentOrder = $this->orders()
            ->where('status', 'completed')
            ->whereHas('transactions', function ($query) {
                $query->where('status', 'pending');
            })
            ->latest()
            ->first();

        $activeOrder = $pendingPaymentOrder ?: $this->orders()
            ->where('status', 'active')
            ->latest()
            ->first();

        $currentPriceRate = $this->table_type_id 
            ? PriceRate::forTableTypeAtTime($this->table_type_id) 
            : null;

        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'seats' => $this->seats,
            'qr_code' => $this->qr_code,
            'location' => $this->location,
            'status' => [
                'id' => $this->status?->id,
                'name' => $this->status?->name,
                'color' => $this->status?->color,
            ],
            'table_type' => [
                'id' => $this->tableType?->id,
                'name' => $this->tableType?->name,
                'price_rates' => $this->tableType?->priceRates?->map(function ($rate) {
                    return [
                        'id' => $rate->id,
                        'price_per_hour' => $rate->price_per_hour,
                        'active' => $rate->active,
                    ];
                }),
                'current_price_rate' => $currentPriceRate ? [
                    'id' => $currentPriceRate->id,
                    'price_per_hour' => $currentPriceRate->price_per_hour,
                    'active' => $currentPriceRate->active,
                ] : null,
            ],
            'pending_order' => $pending ? [
                'id' => $pending->id,
                'user_name' => optional($pending->user)->name,
            ] : null,
            'pending_end_order' => $pendingEnd ? [
                'id' => $pendingEnd->id,
                'order_code' => $pendingEnd->order_code,
                'user_name' => optional($pendingEnd->user)->name,
            ] : null,
            'active_order' => $activeOrder ? [
                'id' => $activeOrder->id,
                'order_code' => $activeOrder->order_code,
                'start_at' => $activeOrder->start_at?->toIso8601String(),
                'status' => $activeOrder->status,
            ] : null,
        ];
    }
}
