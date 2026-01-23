<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Attempt to login to web session for sync
        try {
            \Illuminate\Support\Facades\Auth::guard('web')->login($user, $request->boolean('remember'));
            $request->session()->regenerate();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Session login failed: ' . $e->getMessage());
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        $user->load('roles', 'store'); // Eager load store
        $permissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : collect();

        // Check if user has a store association for redirects
        $storeData = null;
        if ($user->store) {
            $storeData = [
                'id' => $user->store->id,
                'name' => $user->store->name,
                'slug' => $user->store->slug,
            ];
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'roles' => $user->roles->pluck('name'),
                'permissions' => $permissions,
                'store' => $storeData,
            ],
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255', // Removed unique:users to handle manual check
            'phone' => 'nullable|string|max:50',
            'password' => 'required|string|min:8|confirmed',
            'store_slug' => 'nullable|string|exists:stores,slug',
        ]);

        // Custom validation for existing user
        $existingUser = User::where('email', $request->email)->first();
        if ($existingUser) {
            if ($existingUser->store_id) {
                // If user is already associated with a store
                
                // If registering for the same store or a general registration matching the existing store
                $requestStoreId = null;
                if ($request->filled('store_slug')) {
                    $requestStore = \App\Models\Store::where('slug', $request->store_slug)->first();
                    $requestStoreId = $requestStore?->id;
                }

                if ($requestStoreId && $existingUser->store_id != $requestStoreId) {
                     return response()->json([
                        'message' => 'Tài khoản đã được đăng ký ở hệ thống khác',
                        'errors' => ['email' => ['Tài khoản đã được đăng ký ở cửa hàng khác.']]
                    ], 422);
                }

                return response()->json([
                    'message' => 'Tài khoản đã tồn tại',
                    'errors' => ['email' => ['Email đã được đăng ký.']]
                ], 422);
            } else {
                 return response()->json([
                    'message' => 'Tài khoản đã tồn tại',
                    'errors' => ['email' => ['Email đã được đăng ký.']]
                ], 422);
            }
        }

        $storeId = null;
        if ($request->filled('store_slug')) {
            $store = \App\Models\Store::where('slug', $request->store_slug)->first();
            $storeId = $store?->id;
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'store_id' => $storeId, // Associate user with store
        ]);

        $customerRole = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        if (!$user->hasRole($customerRole)) {
            $user->assignRole($customerRole);
        }

        \Illuminate\Support\Facades\Auth::login($user);
        $request->session()->regenerate();

        $token = $user->createToken('auth-token')->plainTextToken;

        $user->load('roles');
        $permissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : collect();
        
        $storeData = null;
        if ($storeId && isset($store)) {
             $storeData = [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
            ];
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'roles' => $user->roles->pluck('name'),
                'permissions' => $permissions,
                'store' => $storeData,
            ],
            'token' => $token,
        ], 201);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        $user->load('roles');
        $permissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : collect();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'roles' => $user->roles->pluck('name'),
            'permissions' => $permissions,
            'store' => $user->store ? [
                'id' => $user->store->id,
                'name' => $user->store->name,
                'slug' => $user->store->slug,
            ] : null,
        ]);
    }

    public function syncToken(Request $request)
    {
        $user = $request->user();
        
        // Generate new token for frontend use from active session
        $token = $user->createToken('session-sync-token')->plainTextToken;
        
        $user->load('roles');
        $permissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : collect();
        
        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'roles' => $user->roles->pluck('name'),
                'permissions' => $permissions,
                'store' => $user->store ? [
                    'id' => $user->store->id,
                    'name' => $user->store->name,
                    'slug' => $user->store->slug,
                ] : null,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        try {
            // Logout ALL guards to ensure complete logout across frontend and admin
            \Illuminate\Support\Facades\Auth::guard('web')->logout();
            
            // Also logout default guard
            \Illuminate\Support\Facades\Auth::guard()->logout();
            
            // Try to logout Filament guard if exists
            try {
                if (\Illuminate\Support\Facades\Auth::guard('filament')->check()) {
                    \Illuminate\Support\Facades\Auth::guard('filament')->logout();
                }
            } catch (\Throwable $e) {
                // Guard might not exist, continue
            }
            
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            // Also delete tokens if any
            if ($request->user()) {
                $request->user()->tokens()->delete();
            }
        } catch (\Throwable $e) {
            // Ignore errors during logout (e.g. if already logged out)
            \Illuminate\Support\Facades\Log::info('Logout error: ' . $e->getMessage());
        }

        // Return response that clears all cookies
        $cookie = \Cookie::forget('laravel_session');
        $xsrf = \Cookie::forget('XSRF-TOKEN');
        $filamentCookie = \Cookie::forget('filament_session');

        return response()->json(['message' => 'Logged out successfully'])
            ->withCookie($cookie)
            ->withCookie($xsrf)
            ->withCookie($filamentCookie);
    }
}
