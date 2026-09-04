<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/docs', function () {
    return view('swagger');
});

Route::get('/api/docs', function () {
    return view('swagger');
});

Route::get('/api/openapi.json', function () {
    return response()->file(public_path('openapi.json'), [
        'Content-Type' => 'application/json',
        'Access-Control-Allow-Origin' => '*',
    ]);
});

Route::get('/openapi.json', function () {
    return response()->file(public_path('openapi.json'), [
        'Content-Type' => 'application/json',
        'Access-Control-Allow-Origin' => '*',
    ]);
});

Route::get('/api', function (Request $request) {
    if ($request->wantsJson()) {
        return response()->json([
            'status' => 'success',
            'message' => 'Stok Pangan Cerdas API is running',
            'health' => '/up',
            'docs' => '/docs',
            'endpoints' => [
                'docs' => '/docs',
                'openapi_spec' => '/api/openapi.json',
                'ringkasan_publik' => '/api/ringkasan-publik',
                'login' => '/api/login',
            ],
        ]);
    }

    return redirect('/docs');
});
