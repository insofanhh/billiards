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
            // Silently fail session login if something is wrong with configuration
            // forcing token auth to still work
            \Illuminate\Support\Facades\Log::error('Session login failed: ' . $e->getMessage());
        }

        // Still issue a token for API clients that might need it (hybrid approach)
        $token = $user->createToken('auth-token')->plainTextToken;

        $user->load('roles');
        $permissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : collect();

        return response()->json([
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
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:50',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        $customerRole = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        if (!$user->hasRole($customerRole)) {
            $user->assignRole($customerRole);
        }

        // Auto login after register
        \Illuminate\Support\Facades\Auth::login($user);
        $request->session()->regenerate();

        $token = $user->createToken('auth-token')->plainTextToken;

        $user->load('roles');
        $permissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : collect();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'roles' => $user->roles->pluck('name'),
                'permissions' => $permissions,
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
            // Logout web session
            \Illuminate\Support\Facades\Auth::guard('web')->logout();
            
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            // Also delete tokens if any
            if ($request->user()) {
                $request->user()->tokens()->delete();
            }
        } catch (\Throwable $e) {
            // Ignore errors during logout (e.g. if already logged out)
        }

        // Return response that clears cookies
        $cookie = \Cookie::forget('laravel_session');
        $xsrf = \Cookie::forget('XSRF-TOKEN');

        return response()->json(['message' => 'Logged out successfully'])
            ->withCookie($cookie)
            ->withCookie($xsrf);
    }
}
