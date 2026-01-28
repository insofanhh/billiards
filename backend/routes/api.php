<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\DiscountCodeController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\SePayWebhookController;
use App\Http\Controllers\Api\StatsController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

Route::post('/platform/register-store', [\App\Http\Controllers\PlatformController::class, 'register']);

Route::prefix('platform')->group(function () {
    Route::post('/login', [\App\Http\Controllers\Api\PlatformAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'platform.admin'])->group(function () {
        Route::get('/me', [\App\Http\Controllers\Api\PlatformAuthController::class, 'me']);
        Route::post('/change-password', [\App\Http\Controllers\Api\PlatformAuthController::class, 'changePassword']);
        Route::post('/logout', [\App\Http\Controllers\Api\PlatformAuthController::class, 'logout']);
        
        // Store Management
        Route::get('/stores', [\App\Http\Controllers\Api\PlatformStoreController::class, 'index']);
        Route::post('/stores', [\App\Http\Controllers\Api\PlatformStoreController::class, 'store']); // Create
        Route::get('/stores/{id}', [\App\Http\Controllers\Api\PlatformStoreController::class, 'show']);
        Route::put('/stores/{id}', [\App\Http\Controllers\Api\PlatformStoreController::class, 'update']);
        Route::delete('/stores/{id}', [\App\Http\Controllers\Api\PlatformStoreController::class, 'destroy']); // Delete

        // Settings
        Route::get('/settings', [\App\Http\Controllers\Api\PlatformSettingController::class, 'index']);
        Route::put('/settings', [\App\Http\Controllers\Api\PlatformSettingController::class, 'update']);

        // User Management
        Route::get('/users', [\App\Http\Controllers\Api\PlatformUserController::class, 'index']);
        Route::get('/users/{id}', [\App\Http\Controllers\Api\PlatformUserController::class, 'show']);
        Route::delete('/users/{id}', [\App\Http\Controllers\Api\PlatformUserController::class, 'destroy']);
    });
});

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout']);

// Public endpoints for guests
Route::get('/tables', [TableController::class, 'index']);
Route::get('/public/stores/{slug}', [\App\Http\Controllers\Api\PublicStoreController::class, 'show']);
Route::get('/public/stores/{slug}/payment-info', [\App\Http\Controllers\Api\StorePaymentController::class, 'getPaymentInfo']);
Route::get('/tables/{code}', [TableController::class, 'show']);
Route::post('/tables/{code}/request-open', [TableController::class, 'requestOpen']);
Route::get('/public-discounts', [DiscountCodeController::class, 'getPublicDiscounts']);
Route::get('/settings/banners', [SettingController::class, 'banners']);
Route::get('/public/posts', [PostController::class, 'index']);
Route::get('/public/posts/{id}', [PostController::class, 'show']);
Route::get('/public/posts/{id}/comments', [CommentController::class, 'index']);
Route::get('/public/categories', [CategoryController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/auth/sync-token', [AuthController::class, 'syncToken']);
    // Route::post('/logout', [AuthController::class, 'logout']); // Moved outside for robust cleanup
    
    
    Route::get('/services', [ServiceController::class, 'index']);
    
    Route::get('/discount-codes/{code}', [DiscountCodeController::class, 'check']);
    Route::get('/stats/daily-revenue', [StatsController::class, 'dailyRevenue']);
    Route::get('/saved-discounts', [DiscountCodeController::class, 'getSavedDiscounts']);
    Route::post('/save-discount/{id}', [DiscountCodeController::class, 'saveDiscount']);
    Route::delete('/save-discount/{id}', [DiscountCodeController::class, 'removeSavedDiscount']);
    
    Route::get('/store/webhook-url', [\App\Http\Controllers\Api\StorePaymentController::class, 'getWebhookUrl']);
    Route::get('/store/payment-settings', [\App\Http\Controllers\Api\StorePaymentController::class, 'getSettings']);
    Route::put('/store/payment-settings', [\App\Http\Controllers\Api\StorePaymentController::class, 'updateSettings']);
    
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/orders/{id}/approve', [OrderController::class, 'approve']);
    Route::patch('/orders/{id}/reject', [OrderController::class, 'reject']);
    Route::post('/orders/{id}/cancel-request', [OrderController::class, 'cancelRequest']);
    Route::post('/orders/{id}/request-end', [OrderController::class, 'requestEnd']);
    Route::patch('/orders/{id}/approve-end', [OrderController::class, 'approveEnd']);
    Route::patch('/orders/{id}/reject-end', [OrderController::class, 'rejectEnd']);
    Route::post('/orders/{id}/apply-discount', [OrderController::class, 'applyDiscount']);
    Route::post('/orders/{id}/remove-discount', [OrderController::class, 'removeDiscount']);
    Route::post('/orders/{id}/services', [OrderController::class, 'addService']);
    Route::post('/orders/{id}/services/bulk', [OrderController::class, 'addServices']);
    Route::patch('/orders/{id}/services/{itemId}', [OrderController::class, 'updateService']);
    Route::patch('/orders/{id}/services/{itemId}/confirm', [OrderController::class, 'confirmServiceItem']);
    Route::delete('/orders/{id}/services/{itemId}', [OrderController::class, 'removeService']);
    Route::post('/orders/{id}/transactions', [OrderController::class, 'createTransaction']);
    Route::patch('/orders/{id}/transactions/{txnId}/confirm', [OrderController::class, 'confirmTransaction']);

    // Blog Routes
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('posts', PostController::class);
    Route::post('posts/upload-image', [PostController::class, 'uploadImage']);
    Route::post('posts/{id}/comments', [CommentController::class, 'store']);
});

// Webhook endpoints for SePay
Route::post('/webhook/sepay/{storeSlug}/{webhookToken}', [SePayWebhookController::class, 'handle']);
Route::post('/webhook/sepay/{storeSlug?}', [SePayWebhookController::class, 'handle'])->where('storeSlug', '[a-z0-9-]+'); // Legacy support 

