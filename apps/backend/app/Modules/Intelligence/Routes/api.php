<?php

use App\Modules\Intelligence\Controllers\RekomendasiController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/rekomendasi', [RekomendasiController::class, 'index']);
    Route::post('/items/{item}/rekomendasi', [RekomendasiController::class, 'store'])->middleware('throttle:15,1');
    Route::patch('/rekomendasi/{rekomendasi}/terapkan', [RekomendasiController::class, 'terapkan']);
});
