<?php

namespace App\Http\Controllers;

use App\Modules\Inventory\Controllers\ItemController as BaseItemController;

/**
 * Backward compatibility alias for Modular Monolith architecture.
 * Canonical Controller: App\Modules\Inventory\Controllers\ItemController
 */
class ItemController extends BaseItemController
{
}
