<?php

use App\Http\Controllers\Api\PaymentController;

use Illuminate\Support\Facades\Route;

Route::post('/payments/backend', [PaymentController::class, 'backend'])->name('ipay88.backend');

Route::post('/payments/{refNo}', [PaymentController::class, 'payment']);
