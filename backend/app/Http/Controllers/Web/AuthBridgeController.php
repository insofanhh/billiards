<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthBridgeController extends Controller
{
    /**
     * Generate token from active session and redirect to frontend
     */
    public function generateToken(Request $request)
    {
        // Check if user is authenticated via session
        if (!Auth::check()) {
            // No active session, redirect to login
            return redirect('/admin/login');
        }

        $user = Auth::user();
        
        // Generate Sanctum token
        $token = $user->createToken('admin-to-frontend')->plainTextToken;
        
        // Get target path from query parameter or use default
        $targetPath = $request->query('redirect', '/');
        
        // Build redirect URL with token as fragment (client-side only)
        // Using fragment (#) ensures token is not sent to server in logs
        $frontendUrl = url($targetPath) . '#token=' . $token;
        
        return redirect($frontendUrl);
    }
}
