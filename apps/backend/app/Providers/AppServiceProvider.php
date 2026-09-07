<?php

namespace App\Providers;

use App\Modules\Intelligence\Contracts\AiInsightServiceInterface;
use App\Modules\Intelligence\Services\GeminiInsightService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(AiInsightServiceInterface::class, GeminiInsightService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production') || request()->header('x-forwarded-proto') === 'https') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
    }
}
