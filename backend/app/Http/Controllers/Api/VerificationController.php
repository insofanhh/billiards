<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use App\Models\User;

class VerificationController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function verify(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        // Check if hash matches
        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Đường dẫn xác thực không hợp lệ.'], 403);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        // Auto login logic: Create token
        $token = $user->createToken('auth_token')->plainTextToken;
        
        // Load relationships and format data like AuthController
        $user->load(['roles', 'store']);
        $permissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : collect();
        
        // Structure user data EXACTLY like AuthController
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'email_verified_at' => $user->email_verified_at,
            'roles' => $user->roles->pluck('name'), // Return array of role names
            'permissions' => $permissions,
            'store' => $user->store ? [
                'id' => $user->store->id,
                'name' => $user->store->name,
                'slug' => $user->store->slug,
                'is_active' => $user->store->is_active,
                'is_expired' => ($user->store->expires_at && $user->store->expires_at->isPast()),
            ] : null,
        ];

        return response()->json([
            'message' => 'Xác thực email thành công.',
            'token' => $token,
            'user' => $userData,
        ]);
    }

    /**
     * Resend the email verification notification.
     */
    public function resend(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email đã được xác thực trước đó.'], 400);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Liên kết xác thực đã được gửi lại vào email của bạn.']);
    }
}
