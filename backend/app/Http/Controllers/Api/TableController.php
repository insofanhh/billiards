<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TableResource;
use App\Models\TableBilliard;
use App\Models\User;
use App\Models\Order;
use App\Events\OrderRequested;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TableController extends Controller
{
    public function index()
    {
        $tables = TableBilliard::with(['status', 'tableType'])->get();
        return TableResource::collection($tables);
    }

    public function show(Request $request, $code)
    {
        $table = TableBilliard::where('code', $code)
            ->with(['status', 'tableType', 'tableType.priceRates'])
            ->firstOrFail();
        
        // Lấy đơn hàng đang active của bàn (không giới hạn theo người tạo)
        $activeOrder = \App\Models\Order::where('table_id', $table->id)
            ->where('status', 'active')
            ->latest('id')
            ->with(['table', 'priceRate'])
            ->first();
        
        $resource = new TableResource($table);
        $data = $resource->toArray($request);
        
        // Thêm thông tin order active vào response
        if ($activeOrder) {
            $data['active_order'] = [
                'id' => $activeOrder->id,
                'order_code' => $activeOrder->order_code,
                'start_at' => $activeOrder->start_at,
            ];
        }
        
        return response()->json($data);
    }

    public function requestOpen(Request $request, string $code)
    {
        $request->validate([
            'name' => 'required|string|min:2|max:255',
        ]);

        $table = TableBilliard::where('code', $code)->firstOrFail();

        // Create temporary user valid for 1 day
        $email = 'guest_' . time() . '_' . Str::random(4) . '@temp.billiards.local';
        $user = User::create([
            'name' => $request->name,
            'email' => $email,
            'password' => Hash::make(Str::random(16)),
            'is_temporary' => true,
            'temporary_expires_at' => Carbon::now('Asia/Ho_Chi_Minh')->addDay(),
        ]);

        if (method_exists($user, 'assignRole')) {
            try { $user->assignRole('customer'); } catch (\Throwable $e) {}
        }

        $token = $user->createToken('guest')->plainTextToken;

        $startTime = Carbon::now('Asia/Ho_Chi_Minh');
        $priceRate = \App\Models\PriceRate::forTableTypeAtTime($table->table_type_id, $startTime);
        
        $order = Order::create([
            'order_code' => 'ORD-' . Str::upper(Str::random(8)),
            'user_id' => $user->id,
            'table_id' => $table->id,
            'price_rate_id' => $priceRate?->id,
            'status' => 'pending',
        ]);

        $order->load(['table', 'user']);

        event(new OrderRequested($order));

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'temporary_expires_at' => $user->temporary_expires_at,
            ],
            'token' => $token,
            'order' => [ 'id' => $order->id ],
        ], 201);
    }
}
