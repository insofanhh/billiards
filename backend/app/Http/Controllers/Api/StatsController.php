<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class StatsController extends Controller
{
    /**
     * Get total revenue for the current day.
     */
    public function dailyRevenue(Request $request)
    {
        $user = $request->user();
        if (!$user->store_id) {
             return response()->json(['revenue' => 0]);
        }
        
        $dayStart = Carbon::now()->startOfDay();
        $dayEnd = Carbon::now()->endOfDay();

        $todayRevenue = Transaction::where('store_id', $user->store_id)
            ->whereBetween('created_at', [$dayStart, $dayEnd])
            ->where('status', 'success')
            ->sum('amount');

        return response()->json([
            'revenue' => $todayRevenue
        ]);
    }
}
