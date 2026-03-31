<?php

use Illuminate\Support\Facades\Route;
use NewSolari\Tags\Controllers\TagsController;

Route::middleware(['auth.api', 'module.enabled:tags', 'partition.app:tags-mini-app'])
    ->prefix('api/tags')
    ->group(function () {
        // Export must be defined before /{id} routes
        Route::middleware(['permission:tags.export'])->get('/export', [TagsController::class, 'export']);
        Route::middleware(['permission:tags.read'])->group(function () {
            Route::get('/', [TagsController::class, 'index']);
            Route::get('/search', [TagsController::class, 'search']);
            Route::get('/stats', [TagsController::class, 'statistics']);
            Route::get('/{id}', [TagsController::class, 'show']);
        });
        Route::middleware(['permission:tags.create'])->post('/', [TagsController::class, 'store']);
        Route::middleware(['permission:tags.update'])->put('/{id}', [TagsController::class, 'update']);
        Route::middleware(['permission:tags.delete'])->delete('/{id}', [TagsController::class, 'destroy']);
    });
