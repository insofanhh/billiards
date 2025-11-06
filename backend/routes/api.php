<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\DiscountCodeController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Public endpoints for guests
Route::get('/tables', [TableController::class, 'index']);
Route::get('/tables/{code}', [TableController::class, 'show']);
Route::post('/tables/{code}/request-open', [TableController::class, 'requestOpen']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    
    Route::get('/services', [ServiceController::class, 'index']);
    
    Route::get('/discount-codes/{code}', [DiscountCodeController::class, 'check']);
    
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/orders/{id}/approve', [OrderController::class, 'approve']);
    Route::patch('/orders/{id}/reject', [OrderController::class, 'reject']);
    Route::post('/orders/{id}/request-end', [OrderController::class, 'requestEnd']);
    Route::patch('/orders/{id}/approve-end', [OrderController::class, 'approveEnd']);
    Route::patch('/orders/{id}/reject-end', [OrderController::class, 'rejectEnd']);
    Route::post('/orders/{id}/services', [OrderController::class, 'addService']);
    Route::patch('/orders/{id}/services/{itemId}', [OrderController::class, 'updateService']);
    Route::delete('/orders/{id}/services/{itemId}', [OrderController::class, 'removeService']);
    Route::post('/orders/{id}/transactions', [OrderController::class, 'createTransaction']);
    Route::patch('/orders/{id}/transactions/{txnId}/confirm', [OrderController::class, 'confirmTransaction']);
});

