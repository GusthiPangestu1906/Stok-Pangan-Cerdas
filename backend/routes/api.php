<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\RekomendasiController;
use App\Http\Controllers\RiwayatController;
use App\Http\Controllers\VoucherController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('items', ItemController::class);

    Route::get('/rekomendasi', [RekomendasiController::class, 'index']);
    Route::post('/items/{item}/rekomendasi', [RekomendasiController::class, 'store']);
    Route::patch('/rekomendasi/{rekomendasi}/terapkan', [RekomendasiController::class, 'terapkan']);

    Route::get('/riwayat', [RiwayatController::class, 'index']);
    Route::get('/riwayat/statistik', [RiwayatController::class, 'statistik']);

    Route::get('/vouchers', [VoucherController::class, 'index']);
    Route::post('/vouchers', [VoucherController::class, 'store']);
    Route::post('/vouchers/validasi', [VoucherController::class, 'validasi']);
    Route::post('/vouchers/{voucher}/klaim', [VoucherController::class, 'klaim']);
});
