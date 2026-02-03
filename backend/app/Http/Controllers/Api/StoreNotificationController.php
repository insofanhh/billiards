<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StoreNotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $notifications = StoreNotification::where('store_id', $user->store_id)
            ->whereNull('read_at')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json($notifications);
    }

    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        $notification = StoreNotification::where('store_id', $user->store_id)
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Marked as read']);
    }

    public function clearAll(Request $request)
    {
        $user = $request->user();
        $type = $request->input('type'); // Optional filter by type

        $query = StoreNotification::where('store_id', $user->store_id)
            ->whereNull('read_at');

        if ($type) {
            $query->where('type', $type);
        }

        $query->update(['read_at' => now()]);

        return response()->json(['message' => 'Cleared all notifications']);
    }
}
