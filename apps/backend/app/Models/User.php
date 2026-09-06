<?php

namespace App\Models;

use App\Modules\Auth\Models\User as BaseUser;

/**
 * Backward compatibility alias for Modular Monolith architecture.
 * Canonical Domain Model: App\Modules\Auth\Models\User
 */
class User extends BaseUser
{
}
