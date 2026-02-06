<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;

class PlatformStoreController extends Controller
{
    public function index(Request $request)
    {
        $query = Store::with('owner');

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
        }

        return $query->paginate(10);
    }

    public function show($id)
    {
        return Store::with('owner')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $store = Store::findOrFail($id);
        
        \Illuminate\Support\Facades\Log::info("Update Store ID: $id", $request->all());

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:stores,slug,' . $id,
            'is_active' => 'boolean',
            'expires_at' => 'nullable|date',
            'birthday' => 'nullable|date',
            'cccd' => 'nullable|string|max:20',
            'phone_contact' => 'nullable|string|max:20',
            'email_contact' => 'nullable|email|max:255',
            'country' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'ward' => 'nullable|string|max:100',
            'address_detail' => 'nullable|string|max:500',
        ]);

        \Illuminate\Support\Facades\Log::info("Validated Data:", $validated);

        $store->update($validated);

        return $store;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'store_name' => ['required', 'string', 'max:255'],
            'owner_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::defaults()],
            'store_type' => ['required', 'string', 'in:billiards,restaurant'],
        ]);

        $slug = \Illuminate\Support\Str::slug($validated['store_name']);
        // Ensure slug is unique
        $originalSlug = $slug;
        $count = 1;
        while (Store::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        try {
            \Illuminate\Support\Facades\Log::info('Register Store Request Data:', $validated);
            \Illuminate\Support\Facades\DB::beginTransaction();

            $settings = app(\App\Settings\GeneralSettings::class);
            $expiresAt = now()->addDays($settings->trial_days);

            // 1. Create Store first
            $store = Store::create([
                'name' => $validated['store_name'],
                'slug' => $slug,
                'store_type' => $validated['store_type'],
                'owner_id' => null,
                'is_active' => true,
                'expires_at' => $expiresAt,
            ]);
            \Illuminate\Support\Facades\Log::info('Created Store:', $store->toArray());

            // 2. Bind store to context
            app()->instance('currentStoreId', $store->id);
            app()->instance('currentStore', $store);

            // 3. Create User with store_id
            $user = \App\Models\User::create([
                'name' => $validated['owner_name'],
                'email' => $validated['email'],
                'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
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
                
                \Illuminate\Support\Facades\DB::table('model_has_roles')
                    ->where('model_id', $user->id)
                    ->where('model_type', get_class($user))
                    ->where('role_id', $superAdminRole->id)
                    ->update(['store_id' => $store->id]);
            }

            // 9. Seed default settings for the store
            $defaultSettings = \App\Settings\GeneralSettings::defaults();
            foreach ($defaultSettings as $key => $value) {
                \Illuminate\Support\Facades\DB::table('settings')->insertOrIgnore([
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

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'message' => 'Store created successfully',
                'store' => $store
            ], 201);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Store Creation Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error creating store: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $store = Store::findOrFail($id);
        
        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            // Delete associated users? Or just the store?
            // Deleting store usually implies deleting everything.
            // For safety, let's just delete the store and rely on cascades if set, 
            // or manually delete related if needed.
            // Based on migration, users might be kept or have null store_id if not cascaded.
            // But roles cascade.
            
            // Let's delete the owner user as well if strictly bound?
            // "Update for full CRUD" -> Delete usually means remove the entity.
            
            $store->delete();
            // Note: If you want to delete all users of that store, you need to loop them.
            // For now simplest destroy.
            
            \Illuminate\Support\Facades\DB::commit();
            return response()->json(['message' => 'Store deleted successfully']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
             return response()->json([
                'message' => 'Error deleting store: ' . $e->getMessage(),
            ], 500);
        }
    }
}
