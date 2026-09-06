<?php

namespace App\Services;

use App\Modules\Intelligence\Services\GeminiInsightService as BaseGeminiInsightService;

/**
 * Backward compatibility alias for Modular Monolith architecture.
 * Canonical Domain Service: App\Modules\Intelligence\Services\GeminiInsightService
 */
class GeminiInsightService extends BaseGeminiInsightService
{
}
