<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing(['transactions.user']);

        $successfulTransaction = $this->transactions->firstWhere('status', 'success');
        $pendingTransaction = $this->transactions
            ->where('status', 'pending')
            ->sortByDesc('created_at')
            ->first();
        $cashierName = optional($successfulTransaction ?? $pendingTransaction)->user?->name;
        $customerName = $successfulTransaction?->customer_name ?? $pendingTransaction?->customer_name;

        return [
            'id' => $this->id,
            'order_code' => $this->order_code,
            'user_id' => $this->user_id,
            'user' => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null,
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
            'items' => $this->items->sortBy('created_at')->map(function ($item) {
                return [
                    'id' => $item->id,
                    'service' => [
                        'id' => $item->service->id,
                        'name' => $item->service->name,
                        'image' => $item->service->image ? Storage::disk('public')->url($item->service->image) : null,
                        'price' => (float) $item->service->price,
                    ],
                    'qty' => (int) $item->qty,
                    'unit_price' => (float) $item->unit_price,
                    'total_price' => (float) $item->total_price,
                    'is_confirmed' => $item->is_confirmed ?? false,
                    'created_at' => $item->created_at?->toIso8601String(),
                ];
            })->values(),
            'applied_discount' => $this->appliedDiscount ? [
                'code' => $this->appliedDiscount->code,
                'discount_type' => $this->appliedDiscount->discount_type,
                'discount_value' => $this->appliedDiscount->discount_value,
            ] : null,
            'cashier' => $cashierName,
            'customer_name' => $customerName,
            'transactions' => $this->transactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'amount' => $transaction->amount,
                    'method' => $transaction->method,
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at->toIso8601String(),
                    'customer_name' => $transaction->customer_name,
                    'user' => $transaction->user ? [
                        'id' => $transaction->user->id,
                        'name' => $transaction->user->name,
                        'email' => $transaction->user->email,
                    ] : null,
                ];
            }),
        ];
    }
}
