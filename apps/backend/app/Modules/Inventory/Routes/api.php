<?php

use App\Modules\Inventory\Controllers\ItemController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('items', ItemController::class);
});
