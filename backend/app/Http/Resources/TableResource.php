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
            ->with(['transactions', 'items'])
            ->latest()
            ->first();

        $activeOrder = $pendingPaymentOrder ?: $this->orders()
            ->where('status', 'active')
            ->with(['transactions', 'priceRate', 'items'])
            ->latest()
            ->first();

        $currentPriceRate = $this->table_type_id 
            ? PriceRate::forTableTypeAtTime($this->table_type_id) 
            : null;

        $activeOrderData = null;
        if ($activeOrder) {
            $totalAmount = $activeOrder->total_paid > 0 ? $activeOrder->total_paid : 0;
            
            if ($totalAmount == 0) {
                // Calculate dynamic time fee
                $timeFee = 0;
                if ($activeOrder->start_at && $activeOrder->status === 'active') {
                    $minutes = abs(now()->diffInMinutes($activeOrder->start_at));
                    
                    // Use order's price rate or table's current rate
                    $pricePerHour = 0;
                    if ($activeOrder->priceRate) {
                         $pricePerHour = $activeOrder->priceRate->price_per_hour;
                    } elseif ($currentPriceRate) {
                         $pricePerHour = $currentPriceRate->price_per_hour;
                    }
                    
                    $timeFee = ($minutes / 60) * $pricePerHour;
                }
                
                // Calculate Items Total from relation
                $itemsTotal = $activeOrder->items ? $activeOrder->items->sum(function($item) {
                     return $item->qty * $item->unit_price;
                }) : 0;
                
                // Provisional = (Items Total + Time Fee) - Discount
                $totalAmount = ($itemsTotal + $timeFee) - $activeOrder->total_discount;
            }

            $activeOrderData = [
                'id' => $activeOrder->id,
                'order_code' => $activeOrder->order_code,
                'start_at' => $activeOrder->start_at?->toIso8601String(),
                'status' => $activeOrder->status,
                'total_amount' => $totalAmount,
                'transactions' => $activeOrder->transactions->map(function ($t) {
                    return [
                        'id' => $t->id,
                        'method' => $t->method,
                        'status' => $t->status,
                        'amount' => $t->amount,
                    ];
                }),
            ];
        }

        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'seats' => $this->seats,
            'qr_code' => $this->qr_code,
            'location' => $this->location,
            'status' => $this->status,
            'table_type' => [
                'id' => $this->tableType?->id,
                'name' => $this->tableType?->name,
                'price_rates' => $this->tableType?->priceRates?->map(function ($rate) {
                    return [
                        'id' => $rate->id,
                        'price_per_hour' => $rate->price_per_hour,
                        'active' => $rate->active,
                        'day_of_week' => $rate->day_of_week,
                        'start_time' => $rate->start_time,
                        'end_time' => $rate->end_time,
                        'priority' => $rate->priority,
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
            'active_order' => $activeOrderData,
        ];
    }
}
