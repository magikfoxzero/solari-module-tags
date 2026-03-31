<?php

namespace NewSolari\Tags;

use Illuminate\Support\ServiceProvider;
use NewSolari\Core\Module\ModuleRegistry;

class TagsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TagsModule::class);
    }

    public function boot(): void
    {
        // Register with module system
        if ($this->app->bound(ModuleRegistry::class)) {
            app(ModuleRegistry::class)->register(app(TagsModule::class));
        }

        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');

        // Load migrations (if any module-specific migrations exist)
        if (is_dir(__DIR__ . '/../database/migrations')) {
            $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
        }
    }
}
