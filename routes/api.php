<?php

use App\Http\Controllers\Api\PaymentController;

use Illuminate\Support\Facades\Route;

Route::post('/payments/backend', [PaymentController::class, 'backend'])->name('ipay88.backend');
Route::post('/payments/backend-callback', [PaymentController::class, 'backend'])->name('ipay88.backend-callback');
Route::match(['GET', 'POST'], '/payments/frontend-callback', [PaymentController::class, 'frontendCallback'])->name('ipay88.frontend-callback');

Route::get('/payments/{refNo}', [PaymentController::class, 'payment']);
