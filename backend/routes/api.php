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
use App\Http\Controllers\Api\SepayController;
use Illuminate\Support\Facades\Route;

Route::prefix('sepay')->group(function () {
    Route::get('/config', [SepayController::class, 'config']);
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Public endpoints for guests
Route::get('/tables', [TableController::class, 'index']);
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
    Route::post('/logout', [AuthController::class, 'logout']);
    
    
    Route::get('/services', [ServiceController::class, 'index']);
    
    Route::get('/discount-codes/{code}', [DiscountCodeController::class, 'check']);
    Route::get('/saved-discounts', [DiscountCodeController::class, 'getSavedDiscounts']);
    Route::post('/save-discount/{id}', [DiscountCodeController::class, 'saveDiscount']);
    Route::delete('/save-discount/{id}', [DiscountCodeController::class, 'removeSavedDiscount']);
    
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
    Route::post('/orders/{id}/services', [OrderController::class, 'addService']);
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

