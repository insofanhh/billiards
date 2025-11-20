<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiscountCode;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class DiscountCodeController extends Controller
{
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

        return response()->json([
            'id' => $discountCode->id,
            'code' => $discountCode->code,
            'discount_type' => $discountCode->discount_type,
            'discount_value' => $discountCode->discount_value,
            'min_spend' => $discountCode->min_spend,
        ]);
    }

    public function getPublicDiscounts(Request $request)
    {
        $now = Carbon::now('Asia/Ho_Chi_Minh');
        
        // Kiểm tra user đã đăng nhập qua token (nếu có)
        $userId = null;
        $bearerToken = $request->bearerToken();
        if ($bearerToken) {
            try {
                $token = PersonalAccessToken::findToken($bearerToken);
                if ($token && (!$token->expires_at || ($token->expires_at && $token->expires_at->isFuture()))) {
                    $userId = $token->tokenable?->id;
                }
            } catch (\Exception $e) {
                // Token không hợp lệ, tiếp tục như guest
            }
        }

        $query = DiscountCode::where('public_discount', true)
            ->where('active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('start_at')
                    ->orWhere('start_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('end_at')
                    ->orWhere('end_at', '>=', $now);
            })
            ->where(function ($query) {
                $query->whereNull('usage_limit')
                    ->orWhereRaw('used_count < usage_limit');
            });

        // Nếu user đã đăng nhập, loại bỏ voucher đã được user lưu
        if ($userId) {
            $savedDiscountIds = DB::table('user_saved_discounts')
                ->where('user_id', $userId)
                ->pluck('discount_code_id')
                ->toArray();
            
            if (!empty($savedDiscountIds)) {
                $query->whereNotIn('id', $savedDiscountIds);
            }
        }

        $discounts = $query->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($discount) {
                return [
                    'id' => $discount->id,
                    'code' => $discount->code,
                    'description' => $discount->description,
                    'discount_type' => $discount->discount_type,
                    'discount_value' => $discount->discount_value,
                    'min_spend' => $discount->min_spend,
                    'start_at' => $discount->start_at?->toIso8601String(),
                    'end_at' => $discount->end_at?->toIso8601String(),
                    'usage_limit' => $discount->usage_limit,
                    'used_count' => $discount->used_count,
                ];
            });

        return response()->json($discounts);
    }

    public function getSavedDiscounts(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $now = Carbon::now('Asia/Ho_Chi_Minh');
        
        // Lấy danh sách discount_id đã được user sử dụng (có trong orders)
        $usedDiscountIds = DB::table('orders')
            ->where('user_id', $user->id)
            ->whereNotNull('applied_discount_id')
            ->pluck('applied_discount_id')
            ->unique()
            ->toArray();

        $query = $user->savedDiscounts()
            ->where('active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('start_at')
                    ->orWhere('start_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('end_at')
                    ->orWhere('end_at', '>=', $now);
            })
            ->where(function ($query) {
                $query->whereNull('usage_limit')
                    ->orWhereRaw('used_count < usage_limit');
            });

        // Loại bỏ voucher đã được user sử dụng
        if (!empty($usedDiscountIds)) {
            $query->whereNotIn('id', $usedDiscountIds);
        }

        $discounts = $query->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($discount) {
                return [
                    'id' => $discount->id,
                    'code' => $discount->code,
                    'description' => $discount->description,
                    'discount_type' => $discount->discount_type,
                    'discount_value' => $discount->discount_value,
                    'min_spend' => $discount->min_spend,
                    'start_at' => $discount->start_at?->toIso8601String(),
                    'end_at' => $discount->end_at?->toIso8601String(),
                    'usage_limit' => $discount->usage_limit,
                    'used_count' => $discount->used_count,
                ];
            });

        return response()->json($discounts);
    }

    public function saveDiscount(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($user->is_temporary || preg_match('/^guest_\d+_[a-z0-9]+@temp\.billiards\.local$/i', $user->email)) {
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

        $user->savedDiscounts()->attach($id);

        return response()->json(['message' => 'Đã lưu voucher thành công']);
    }

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
