<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TableResource;
use App\Models\TableBilliard;
use App\Models\Order;
use App\Models\User;
use App\Events\OrderRequested;
use App\Services\GuestAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class TableController extends Controller
{
    protected GuestAuthService $guestAuthService;

    public function __construct(GuestAuthService $guestAuthService)
    {
        $this->guestAuthService = $guestAuthService;
    }

    public function index(Request $request)
    {
        // Attempt to authenticate using Sanctum guard even if route is public
        $user = $request->user('sanctum');
        
        $query = TableBilliard::with(['tableType']);
        
        if ($user && $user->store_id) {
            $query->where('store_id', $user->store_id);
        } elseif ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }
        // If user->store_id is null, return all tables (Super Admin view)

        $tables = $query->get();
        return TableResource::collection($tables);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->store_id) {
            // Super admin allow creating for store
             $request->validate([
                'store_id' => 'required|exists:stores,id',
            ]);
        }

        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'seats' => 'required|integer|min:1',
            'qr_code' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'status' => 'required|string|max:50',
            'table_type_id' => 'required|exists:table_types,id',
        ]);

        if ($user->store_id) {
            $validated['store_id'] = $user->store_id;
        } else {
             $validated['store_id'] = $request->store_id;
        }

        $table = TableBilliard::create($validated);

        return new TableResource($table->load('tableType'));
    }

    public function show(Request $request, $code)
    {
        $user = $request->user();
        $query = TableBilliard::where('code', $code)
            ->with(['tableType', 'tableType.priceRates']);
            
        if ($user && $user->store_id) {
             $query->where('store_id', $user->store_id);
        }
            
        // Eager load active order to optimize Resource usage or accessing it directly
        // However, TableResource calls ->orders(), so standard eager loading 'orders' 
        // with constraints is complex. For 'show', N+1 is less critical (1 query).
        
        $table = $query->firstOrFail();
        
        return new TableResource($table);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $query = TableBilliard::where('id', $id);
            
        if ($user->store_id) {
            $query->where('store_id', $user->store_id);
        }
            
        $table = $query->firstOrFail();

        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:50',
            'name' => 'sometimes|required|string|max:255',
            'seats' => 'sometimes|required|integer|min:1',
            'qr_code' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'status' => 'sometimes|required|string|max:50',
            'table_type_id' => 'sometimes|required|exists:table_types,id',
        ]);

        $table->update($validated);

        return new TableResource($table->load('tableType'));
    }

    public function requestOpen(Request $request, string $code)
    {
        $table = TableBilliard::where('code', $code)->firstOrFail();

        // Use standard Sanctum auth
        $authenticatedUser = auth('sanctum')->user();

        // Check for existing blocking orders
        $blockingOrder = Order::where('table_id', $table->id)
            ->whereIn('status', ['pending', 'active', 'pending_end'])
            ->latest('id')
            ->first();

        if ($blockingOrder) {
            // If user is the owner of the pending request, return info instead of error
            if (
                $blockingOrder->status === 'pending' &&
                $authenticatedUser &&
                $blockingOrder->user_id === $authenticatedUser->id
            ) {
                return response()->json([
                    'user' => [
                        'id' => $authenticatedUser->id,
                        'name' => $authenticatedUser->name,
                        'email' => $authenticatedUser->email,
                    ],
                    'order' => [
                        'id' => $blockingOrder->id,
                        'status' => $blockingOrder->status,
                        'already_pending' => true,
                    ],
                ]);
            }

            return $this->responseForBlockingOrder($blockingOrder);
        }
        
        $token = null;
        if ($authenticatedUser) {
            $user = $authenticatedUser;
        } else {
            // Guest Flow
            $validated = $request->validate([
                'name' => 'required|string|min:2|max:255',
            ]);

            $user = $this->guestAuthService->createGuestUser($validated['name']);
            $token = $user->createToken('guest')->plainTextToken;
        }

        $startTime = Carbon::now(); // Use app timezone
        $priceRate = \App\Models\PriceRate::forTableTypeAtTime($table->table_type_id, $startTime);
        
        $order = Order::create([
            'order_code' => 'ORD-' . Str::upper(Str::random(8)),
            'user_id' => $user->id,
            'table_id' => $table->id,
            'store_id' => $table->store_id,
            'price_rate_id' => $priceRate?->id,
            'status' => 'pending',
        ]);

        $order->load(['table', 'user']);
        event(new OrderRequested($order));

        $responseData = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'order' => [
                'id' => $order->id,
                'status' => $order->status,
            ],
        ];

        if ($token) {
            $responseData['token'] = $token;
            // $user is guaranteed to have the attribute if created by service, 
            // but check just in case or use the one on model
            $responseData['user']['temporary_expires_at'] = $user->temporary_expires_at;
        }

        return response()->json($responseData, 201);
    }

    private function responseForBlockingOrder(Order $order)
    {
        $message = match ($order->status) {
            'pending' => 'Bàn đang có yêu cầu mở, vui lòng chờ nhân viên xác nhận.',
            'pending_end' => 'Bàn đang chờ xác nhận kết thúc, vui lòng thử lại sau.',
            'active' => 'Bàn đang được sử dụng.',
            default => 'Bàn hiện không khả dụng.',
        };

        return response()->json(['message' => $message], 409);
    }
}
