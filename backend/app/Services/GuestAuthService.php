<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GuestAuthService
{
    /**
     * Create a temporary guest user.
     *
     * @param string $name
     * @return User
     */
    public function createGuestUser(string $name): User
    {
        $email = 'guest_' . time() . '_' . Str::random(4) . '@temp.billiards.local';
        
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make(Str::random(32)), // Strong random password
            'is_temporary' => true,
            'temporary_expires_at' => Carbon::now()->addDay(),
        ]);

        if (method_exists($user, 'assignRole')) {
            try { 
                $user->assignRole('customer'); 
            } catch (\Throwable $e) {
                // Role might not exist, ignore
            }
        }

        return $user;
    }
}
