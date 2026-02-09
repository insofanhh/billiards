<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Sanctum\PersonalAccessToken;

class SocialAuthController extends Controller
{
    public function redirect(Request $request)
    {
        $request->validate([
            'slug' => 'nullable|string|exists:stores,slug',
        ]);

        $slug = $request->query('slug');

        $driver = Socialite::driver('google')->stateless();

        // Pass slug in state so we know which store they are logging into upon return
        if ($slug) {
            $driver->with(['state' => 'slug=' . $slug]);
        }

        return $driver->redirect();
    }

    public function callback(Request $request)
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        try {
            /** @var \Laravel\Socialite\Two\User $socialUser */
            $socialUser = Socialite::driver('google')->stateless()->user();
            
            // Try to extract slug from state
            $state = $request->input('state');
            $slug = null;
            if ($state) {
                parse_str($state, $stateParams);
                $slug = $stateParams['slug'] ?? null;
            }

            // Case 1: Slug is provided (Context Login)
            if ($slug) {
                $store = Store::where('slug', $slug)->firstOrFail();

                // Find or Create User
                $user = User::firstOrCreate(
                    ['email' => $socialUser->getEmail()],
                    [
                        'name' => $socialUser->getName(),
                        'password' => bcrypt(str()->random(16)),
                        'email_verified_at' => now(),
                    ]
                );

                if ($user->roles->isEmpty()) {
                    $user->assignRole('customer');
                }
                
                // Link user to this store if not already linked
                // Logic: If user visits a specific store and logs in, we assume they are engaging with this store.
                // We update their store_id to this store if it's currently null.
                if (!$user->store_id) {
                    $user->store_id = $store->id;
                    $user->save();
                }
            } 
            // Case 2: No Slug provided (Generic Login)
            else {
                $user = User::where('email', $socialUser->getEmail())->first();

                if (!$user) {
                    // Scenario: User login without context, and account doesn't exist.
                    // We don't know which store to register them to.
                    return redirect("{$frontendUrl}/login?error=account_not_found");
                }

                if (!$user->store_id) {
                    // Scenario: User exists but not linked to any store.
                    return redirect("{$frontendUrl}/login?error=no_store_linked");
                }

                // User exists and linked, find their store
                $store = Store::find($user->store_id);
                if (!$store) {
                     return redirect("{$frontendUrl}/login?error=store_not_found");
                }
                $slug = $store->slug;
            }

            // Generate Token
            $token = $user->createToken('google-login')->plainTextToken;

            // Redirect to the determined store
            return redirect("{$frontendUrl}/s/{$slug}?token={$token}");

        } catch (\Exception $e) {
            Log::error('Google Login Error: ' . $e->getMessage());
            return redirect("{$frontendUrl}/login?error=google_login_failed");
        }
    }
}
