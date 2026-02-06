<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;

class PlatformController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'store_name' => ['required', 'string', 'max:255'],
            'owner_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'store_type' => ['required', 'string', 'in:billiards,restaurant'],
        ]);

        $slug = Str::slug($validated['store_name']);
        // Ensure slug is unique
        $originalSlug = $slug;
        $count = 1;
        while (Store::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        try {
            DB::beginTransaction();

            // 1. Create Store first
            $store = Store::create([
                'name' => $validated['store_name'],
                'slug' => $slug,
                'store_type' => $validated['store_type'],
                'owner_id' => null, // Will update later
                'expires_at' => now()->addDays(\App\Models\SettingPlatform::first()?->trial_days ?? 7),
                'is_active' => true,
            ]);

            // 2. Bind store to context BEFORE creating user
            app()->instance('currentStoreId', $store->id);
            app()->instance('currentStore', $store);

            // 3. Create User with store_id
            $user = User::create([
                'name' => $validated['owner_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'store_id' => $store->id,
            ]);

            // 4. Update Store's owner
            $store->owner_id = $user->id;
            $store->save();

            // 5. Create default roles for new store
            $roles = ['super_admin', 'admin', 'customer', 'staff'];
            foreach ($roles as $roleName) {
                \App\Models\Role::firstOrCreate([
                    'name' => $roleName,
                    'guard_name' => 'web',
                    'store_id' => $store->id
                ]);
            }

            // 6. Get super_admin role for this store
            $superAdminRole = \App\Models\Role::where('name', 'super_admin')
                ->where('store_id', $store->id)
                ->first();

            // 7. Sync ALL permissions to super_admin role
            $permissions = \Spatie\Permission\Models\Permission::all();
            if ($superAdminRole && $permissions->isNotEmpty()) {
                $superAdminRole->syncPermissions($permissions);
            }

            // 8. Assign super_admin role to owner
            if ($superAdminRole) {
                $user->assignRole($superAdminRole);
                
                // Update store_id in pivot table
                DB::table('model_has_roles')
                    ->where('model_id', $user->id)
                    ->where('model_type', get_class($user))
                    ->where('role_id', $superAdminRole->id)
                    ->update(['store_id' => $store->id]);
            }

            // 9. Seed default settings for the store
            $defaultSettings = \App\Settings\GeneralSettings::defaults();
            foreach ($defaultSettings as $key => $value) {
                DB::table('settings')->insertOrIgnore([
                    'group' => 'general',
                    'name' => $key,
                    'payload' => json_encode($value),
                    'locked' => false,
                    'store_id' => $store->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 10. Clear permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            DB::commit();
            
            $token = $user->createToken('auth_token')->plainTextToken;

            // Load roles and prepare permissions for frontend
            $user->load('roles');
            $permissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : collect();

            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
                'permissions' => $permissions,
            ];

            return response()->json([
                'message' => 'Đăng ký thành công',
                'store' => $store,
                'user' => $userData,
                'token' => $token,
                'redirect_url' => "/s/{$store->slug}"
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Registration Error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'message' => 'Lỗi đăng ký: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
