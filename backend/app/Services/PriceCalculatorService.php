<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PriceRate;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class PriceCalculatorService
{
    /**
     * Calculate the cost of the table for a given duration.
     *
     * @param Order $order
     * @param Carbon $startTime
     * @param Carbon $endTime
     * @return float
     */
    public function calculateTableCost(Order $order, Carbon $startTime, Carbon $endTime): float
    {
        /** @var Collection<int, PriceRate> $rates */
        $rates = PriceRate::where('table_type_id', $order->table->table_type_id)
            ->active()
            ->orderBy('priority', 'desc')
            ->orderBy('id', 'asc')
            ->get();

        $totalCost = 0.0;
        $current = $startTime->copy();

        // Iterate through each minute of the play time
        while ($current->lt($endTime)) {
            $rateToUse = $this->findMatchingRate($rates, $current, $order);
            
            // Add cost for this minute (price per hour / 60)
            $totalCost += $rateToUse / 60.0;
            
            $current->addMinute();
        }

        return $totalCost;
    }

    /**
     * Find the best matching price rate for a specific moment in time.
     *
     * @param Collection $rates
     * @param Carbon $current
     * @param Order $order
     * @return float
     */
    private function findMatchingRate(Collection $rates, Carbon $current, Order $order): float
    {
        $dayOfWeek = $current->dayOfWeek;
        $timeStr = $current->format('H:i:s');
        $prevDayOfWeek = ($dayOfWeek - 1 + 7) % 7;

        foreach ($rates as $rate) {
            // Check 1: Valid for current day (Standard or Start of Overnight)
            if ($this->isDayValid($rate, $dayOfWeek)) {
                if ($this->isTimeValidForCurrentDay($rate, $timeStr)) {
                    return $rate->price_per_hour;
                }
            }

            // Check 2: Valid as extension of previous day (End of Overnight)
            if ($this->isDayValid($rate, $prevDayOfWeek)) {
                if ($this->isTimeValidForOvernightEnd($rate, $timeStr)) {
                    return $rate->price_per_hour;
                }
            }
        }

        // Fallback: Use the order's initial frozen rate or 0
        return $order->priceRate ? $order->priceRate->price_per_hour : 0.0;
    }

    /**
     * Check if the rate is applicable for the given day of week.
     */
    private function isDayValid(PriceRate $rate, int $dayOfWeek): bool
    {
        return $rate->day_of_week === null || in_array((string)$dayOfWeek, $rate->day_of_week, true);
    }

    /**
     * Check if time matches a standard range or the start of an overnight range on the current day.
     */
    private function isTimeValidForCurrentDay(PriceRate $rate, string $timeStr): bool
    {
        // Always valid if no time limits
        if ($rate->start_time === null && $rate->end_time === null) {
            return true;
        }

        $start = $rate->start_time;
        $end = $rate->end_time;

        if ($start <= $end) {
            // Standard range (e.g., 08:00 - 17:00)
            return $timeStr >= $start && $timeStr <= $end;
        } else {
            // Overnight range (e.g., 18:00 - 06:00)
            // On the starting day, it's valid if current time >= start
            return $timeStr >= $start;
        }
    }

    /**
     * Check if time matches the end of an overnight range from the previous day.
     */
    private function isTimeValidForOvernightEnd(PriceRate $rate, string $timeStr): bool
    {
        // Only applicable if the rate has time limits
        if ($rate->start_time !== null && $rate->end_time !== null) {
            $start = $rate->start_time;
            $end = $rate->end_time;

            if ($start > $end) {
                // Overnight logic: If it started yesterday, valid today if time <= end
                return $timeStr <= $end;
            }
        }

        return false;
    }
}
