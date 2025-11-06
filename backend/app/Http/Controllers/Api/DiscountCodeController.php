<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiscountCode;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

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
}
