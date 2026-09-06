<?php

use App\Modules\Analytics\Controllers\RingkasanPublikController;
use App\Modules\Analytics\Controllers\RiwayatController;
use Illuminate\Support\Facades\Route;

Route::get('/ringkasan-publik', [RingkasanPublikController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/riwayat', [RiwayatController::class, 'index']);
    Route::get('/riwayat/statistik', [RiwayatController::class, 'statistik']);
});
