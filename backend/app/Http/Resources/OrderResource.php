<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_code' => $this->order_code,
            'table' => [
                'id' => $this->table?->id,
                'code' => $this->table?->code,
                'name' => $this->table?->name,
            ],
            'price_rate' => [
                'id' => $this->priceRate?->id,
                'price_per_hour' => $this->priceRate?->price_per_hour,
            ],
            'start_at' => $this->start_at?->toIso8601String(),
            'end_at' => $this->end_at?->toIso8601String(),
            'status' => $this->status,
            'total_play_time_minutes' => $this->total_play_time_minutes,
            'total_before_discount' => $this->total_before_discount,
            'total_discount' => $this->total_discount,
            'total_paid' => $this->total_paid,
            'items' => $this->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'service' => [
                        'id' => $item->service->id,
                        'name' => $item->service->name,
                        'price' => $item->service->price,
                    ],
                    'qty' => $item->qty,
                    'unit_price' => $item->unit_price,
                    'total_price' => $item->total_price,
                ];
            }),
            'applied_discount' => $this->appliedDiscount ? [
                'code' => $this->appliedDiscount->code,
                'discount_type' => $this->appliedDiscount->discount_type,
                'discount_value' => $this->appliedDiscount->discount_value,
            ] : null,
            'transactions' => $this->transactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'amount' => $transaction->amount,
                    'method' => $transaction->method,
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at->toIso8601String(),
                ];
            }),
        ];
    }
}
