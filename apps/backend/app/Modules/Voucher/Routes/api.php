<?php

use App\Modules\Voucher\Controllers\VoucherController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/vouchers', [VoucherController::class, 'index']);
    Route::post('/vouchers', [VoucherController::class, 'store']);
    Route::post('/vouchers/validasi', [VoucherController::class, 'validasi']);
    Route::post('/vouchers/{voucher}/klaim', [VoucherController::class, 'klaim']);
});
