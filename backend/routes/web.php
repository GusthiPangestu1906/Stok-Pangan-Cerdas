<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/api', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Stok Pangan Cerdas API is running',
        'health' => '/up',
        'endpoints' => [
            'ringkasan_publik' => '/api/ringkasan-publik',
            'login' => '/api/login',
        ],
    ]);
});
