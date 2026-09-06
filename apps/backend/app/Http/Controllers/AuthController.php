<?php

namespace App\Http\Controllers;

use App\Modules\Auth\Controllers\AuthController as BaseAuthController;

/**
 * Backward compatibility alias for Modular Monolith architecture.
 * Canonical Controller: App\Modules\Auth\Controllers\AuthController
 */
class AuthController extends BaseAuthController
{
}
