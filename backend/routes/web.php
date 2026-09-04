<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::any('/debug-url', function (\Illuminate\Http\Request $request) {
    return response()->json([
        'uri' => $request->getRequestUri(),
        'path' => $request->path(),
        'server_request_uri' => $_SERVER['REQUEST_URI'] ?? null,
        'server_script_name' => $_SERVER['SCRIPT_NAME'] ?? null,
        'server_path_info' => $_SERVER['PATH_INFO'] ?? null,
    ]);
});
