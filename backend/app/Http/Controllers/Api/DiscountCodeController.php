<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DiscountCodeResource;
use App\Models\DiscountCode;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DiscountCodeController extends Controller
{
    /**
     * Check if a discount code is valid.
     */
    public function check($code)
    {
        $discountCode = DiscountCode::where('code', $code)->first();

        if (!$discountCode) {
            return response()->json(['message' => 'Mã giảm giá không tồn tại'], 404);
        }

        if (!$discountCode->active) {
            return response()->json(['message' => 'Mã giảm giá không còn hiệu lực'], 400);
        }

        $now = Carbon::now();
        if ($discountCode->start_at && $now->lt($discountCode->start_at)) {
            return response()->json(['message' => 'Mã giảm giá chưa có hiệu lực'], 400);
        }

        if ($discountCode->end_at && $now->gt($discountCode->end_at)) {
            return response()->json(['message' => 'Mã giảm giá đã hết hạn'], 400);
        }

        if ($discountCode->usage_limit && $discountCode->used_count >= $discountCode->usage_limit) {
            return response()->json(['message' => 'Mã giảm giá đã hết lượt sử dụng'], 400);
        }

        // Use standard Resource but return specific fields for check endpoint if needed, 
        // or just use the Resource (which exposes safe fields).
        // The original code returned a subset. To allow flexibility, let's return the full safe resource.
        return new DiscountCodeResource($discountCode);
    }

    /**
     * Get list of public discount codes.
     */
    public function getPublicDiscounts(Request $request)
    {
        $now = Carbon::now();
        
        // Use Sanctum guard to get user securely
        $user = auth('sanctum')->user();

        $query = DiscountCode::where('public_discount', true)
            ->where('active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('start_at')
                    ->orWhere('start_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('end_at')
                    ->orWhere('end_at', '>=', $now);
            });

        if ($request->has('store_slug')) {
             $storeSlug = $request->input('store_slug');
             $store = \App\Models\Store::where('slug', $storeSlug)->first();
             if ($store) {
                 $query->where('store_id', $store->id);
             }
        }

        $query->where(function ($query) {
                $query->whereNull('usage_limit')
                    ->orWhereRaw('used_count < usage_limit');
            });

        // Filter out codes relevant to the user
        if ($user) {
            $savedDiscountIds = $user->savedDiscounts()->pluck('discount_codes.id');
            
            // Assuming 'orders' relationship exists on User model to find used discounts
            $usedDiscountIds = DB::table('orders')
                ->where('user_id', $user->id)
                ->whereNotNull('applied_discount_id')
                ->pluck('applied_discount_id')
                ->unique();
            
            if ($savedDiscountIds->isNotEmpty()) {
                $query->whereNotIn('id', $savedDiscountIds);
            }

            if ($usedDiscountIds->isNotEmpty()) {
                $query->whereNotIn('id', $usedDiscountIds);
            }
        }

        $discounts = $query->orderBy('created_at', 'desc')->get();

        return DiscountCodeResource::collection($discounts);
    }

    /**
     * Get discounts saved by the user.
     */
    public function getSavedDiscounts(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $now = Carbon::now();

        $discounts = $user->savedDiscounts()
            ->where('active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('start_at')
                    ->orWhere('start_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('end_at')
                    ->orWhere('end_at', '>=', $now);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return DiscountCodeResource::collection($discounts);
    }

    /**
     * Save a discount code to user's wallet.
     */
    public function saveDiscount(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($user->isGuestAccount()) {
            return response()->json([
                'message' => 'Vui lòng đăng ký thành viên để lưu voucher vào ví',
                'requires_registration' => true
            ], 403);
        }

        $discount = DiscountCode::where('id', $id)
            ->where('public_discount', true)
            ->where('active', true)
            ->first();

        if (!$discount) {
            return response()->json(['message' => 'Voucher không tồn tại hoặc không khả dụng'], 404);
        }

        if ($user->savedDiscounts()->where('discount_code_id', $id)->exists()) {
            return response()->json(['message' => 'Voucher đã được lưu'], 400);
        }

        // Check if user has already used this discount in an order
        // Optimization: Check DB directly for speed, or via relationship
        $hasUsedDiscount = DB::table('orders')
            ->where('user_id', $user->id)
            ->where('applied_discount_id', $id)
            ->exists();

        if ($hasUsedDiscount) {
            return response()->json(['message' => 'Voucher đã được bạn sử dụng trước đó. Chờ quản trị viên xuất bản lại để dùng tiếp.'], 400);
        }

        $user->savedDiscounts()->attach($id);

        return response()->json(['message' => 'Đã lưu voucher thành công']);
    }

    /**
     * Remove a saved discount from user's wallet.
     */
    public function removeSavedDiscount(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user->savedDiscounts()->detach($id);

        return response()->json(['message' => 'Đã xóa voucher khỏi ví']);
    }
}
