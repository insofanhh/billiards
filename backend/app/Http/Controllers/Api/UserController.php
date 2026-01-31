<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Only return users of the same store, excluding guests if preferred, but requesting 'list users' usually implies real users.
        // Assuming listing staff/admins mainly.
        
        if ($user->store_id) {
            $query = User::with('roles')->where('store_id', $user->store_id);
        } else {
             // Super admin - list all users (careful with large lists, maybe paginate later)
             $query = User::with('roles');
             
             if ($request->filled('store_id')) {
                 $query->where('store_id', $request->store_id);
             }
        }
        
        $users = $query->get();
        
        // Hide sensitive data handled by model hidden array, but manually ensure if needed.
        return response()->json(['data' => $users]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->store_id) {
            $request->validate([
                'store_id' => 'required|exists:stores,id',
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|string|exists:roles,name', // Accepts role name like 'staff', 'manager'
        ]);

        if ($user->store_id) {
            $validated['store_id'] = $user->store_id;
        } else {
             $validated['store_id'] = $request->store_id;
        }
        $validated['password'] = Hash::make($validated['password']);
        $validated['is_temporary'] = false;

        $newUser = User::create($validated);
        
        if (!empty($validated['role'])) {
            $newUser->assignRole($validated['role']);
        } else {
            // Default role if not specified? Or leave empty. 
            // Often defaults to 'staff' if needed, but let's keep it optional.
        }

        return response()->json(['data' => $newUser->load('roles')], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $query = User::where('id', $id);
            
        if ($user->store_id) {
            $query->where('store_id', $user->store_id);
        }
            
        $targetUser = $query->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $targetUser->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|string|exists:roles,name',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $targetUser->update($validated);
        
        if (array_key_exists('role', $validated)) {
             // If role is passed (even null), sync it. If null/empty -> remove roles? 
             // Logic: assignRole usually adds. syncRoles replaces.
             if ($validated['role']) {
                 $targetUser->syncRoles([$validated['role']]);
             } else {
                 // If role is explicitly sent as null/empty string, maybe remove all roles?
                 // Be careful not to lock out admins. Assuming this is for managing sub-users.
                 // Safer: only sync if provided.
             }
        }

        return response()->json(['data' => $targetUser->load('roles')]);
    }
}
