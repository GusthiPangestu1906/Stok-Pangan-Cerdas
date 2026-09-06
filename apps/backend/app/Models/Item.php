<?php

namespace App\Models;

use App\Modules\Inventory\Models\Item as BaseItem;

/**
 * Backward compatibility alias for Modular Monolith architecture.
 * Canonical Domain Model: App\Modules\Inventory\Models\Item
 */
class Item extends BaseItem
{
}
