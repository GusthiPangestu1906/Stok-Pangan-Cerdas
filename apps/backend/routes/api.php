<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function (\Illuminate\Http\Request $request) {
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

    return redirect()->secure('/docs');
});

/*
|--------------------------------------------------------------------------
| Modular Monolith Route Registration (Bounded Contexts)
|--------------------------------------------------------------------------
| Each domain module manages its own endpoints and middleware isolation.
*/
require app_path('Modules/Auth/Routes/api.php');
require app_path('Modules/Inventory/Routes/api.php');
require app_path('Modules/Intelligence/Routes/api.php');
require app_path('Modules/Voucher/Routes/api.php');
require app_path('Modules/Analytics/Routes/api.php');
