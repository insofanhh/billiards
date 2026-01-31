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
        
        $date = $request->input('date', now()->toDateString());
        $dayStart = Carbon::parse($date)->startOfDay();
        $dayEnd = Carbon::parse($date)->endOfDay();

        $query = Transaction::whereBetween('created_at', [$dayStart, $dayEnd])
            ->where('status', 'success');
            
        if ($user->store_id) {
            $query->where('store_id', $user->store_id);
        } elseif ($request->filled('store_id')) {
            // Allow Super Admin to filter by specific store
            $query->where('store_id', $request->store_id);
        }

        $todayRevenue = $query->sum('amount');

        return response()->json([
            'revenue' => $todayRevenue
        ]);
    }

    public function productSales(Request $request)
    {
        $user = $request->user();

        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        $query = \App\Models\OrderItem::select(
                'services.name',
                \Illuminate\Support\Facades\DB::raw('SUM(order_items.qty) as total_qty'),
                \Illuminate\Support\Facades\DB::raw('SUM(order_items.total_price) as total_revenue')
            )
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('services', 'order_items.service_id', '=', 'services.id')
            ->whereIn('orders.status', ['completed', 'active', 'pending_end'])
            ->whereBetween('orders.created_at', [$start, $end]);
            
        if ($user->store_id) {
            $query->where('orders.store_id', $user->store_id);
        } elseif ($request->filled('store_id')) {
             $query->where('orders.store_id', $request->store_id);
        }

        $stats = $query->groupBy('services.id', 'services.name')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get();

        return response()->json(['data' => $stats]);
    }

    public function generalStats(Request $request)
    {
        $user = $request->user();

        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        // 1. Total Revenue (Transactions)
        $revenueQuery = Transaction::whereBetween('created_at', [$start, $end])
            ->where('status', 'success');
        
        // 2. Total Orders
        $ordersQuery = \App\Models\Order::whereBetween('created_at', [$start, $end])
            ->where('status', 'completed');
            
        // 3. Active Tables
        $activeTablesQuery = \App\Models\TableBilliard::where('status', 'Đang sử dụng');
        
        if ($user->store_id) {
             $revenueQuery->where('store_id', $user->store_id);
             $ordersQuery->where('store_id', $user->store_id);
             $activeTablesQuery->where('store_id', $user->store_id);
        } elseif ($request->filled('store_id')) {
             $revenueQuery->where('store_id', $request->store_id);
             $ordersQuery->where('store_id', $request->store_id);
             $activeTablesQuery->where('store_id', $request->store_id);
        }

        return response()->json([
            'total_revenue' => $revenueQuery->sum('amount'),
            'total_orders' => $ordersQuery->count(),
            'active_tables' => $activeTablesQuery->count(),
        ]);
    }

    /**
     * Get statistics for ALL stores in a single list (Super Admin only)
     */
    public function allStoresStats(Request $request)
    {
        $user = $request->user();
        if ($user->store_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        $stores = \App\Models\Store::all();
        $result = [];

        foreach ($stores as $store) {
            $revenue = Transaction::where('store_id', $store->id)
                ->whereBetween('created_at', [$start, $end])
                ->where('status', 'success')
                ->sum('amount');

            $orders = \App\Models\Order::where('store_id', $store->id)
                ->whereBetween('created_at', [$start, $end])
                ->where('status', 'completed')
                ->count();

            $activeTables = \App\Models\TableBilliard::where('store_id', $store->id)
                ->where('status', 'Đang sử dụng')
                ->count();

            $result[] = [
                'store_id' => $store->id,
                'store_name' => $store->name,
                'total_revenue' => $revenue,
                'total_orders' => $orders,
                'active_tables' => $activeTables,
            ];
        }

        return response()->json(['data' => $result]);
    }

    /**
     * Get top product sales for ALL stores (Super Admin only)
     */
    public function allStoresProductSales(Request $request)
    {
        $user = $request->user();
        if ($user->store_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        $stores = \App\Models\Store::all();
        $result = [];

        foreach ($stores as $store) {
            $stats = \App\Models\OrderItem::select(
                    'services.name',
                    \Illuminate\Support\Facades\DB::raw('SUM(order_items.qty) as total_qty'),
                    \Illuminate\Support\Facades\DB::raw('SUM(order_items.total_price) as total_revenue')
                )
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('services', 'order_items.service_id', '=', 'services.id')
                ->where('orders.store_id', $store->id)
                ->whereIn('orders.status', ['completed', 'active', 'pending_end'])
                ->whereBetween('orders.created_at', [$start, $end])
                ->groupBy('services.id', 'services.name')
                ->orderByDesc('total_qty')
                ->limit(10)
                ->get();

            $result[] = [
                'store_id' => $store->id,
                'store_name' => $store->name,
                'product_sales' => $stats
            ];
        }

        return response()->json(['data' => $result]);
    }
}
