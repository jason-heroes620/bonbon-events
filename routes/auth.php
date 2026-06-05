<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VendorAuthenticatedSessionController;
use App\Http\Controllers\Auth\VendorNewPasswordController;
use App\Http\Controllers\Auth\VendorPasswordResetLinkController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\VendorProfileController;
use App\Http\Controllers\VendorsController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('vendor/register', [VendorsController::class, 'register'])
        ->name('vendor.register');
    Route::post('vendor/register', [VendorsController::class, 'storeRegistration'])
        ->name('vendor.register.store');

    Route::get('vendor/login', [VendorAuthenticatedSessionController::class, 'create'])
        ->name('vendor.login');
    Route::post('vendor/login', [VendorAuthenticatedSessionController::class, 'store'])
        ->name('vendor.login.store');

    Route::get('vendor/forgot-password', [VendorPasswordResetLinkController::class, 'create'])
        ->name('vendor.password.request');

    Route::post('vendor/forgot-password', [VendorPasswordResetLinkController::class, 'store'])
        ->name('vendor.password.email');

    Route::get('vendor/reset-password/{token}', [VendorNewPasswordController::class, 'create'])
        ->name('vendor.password.reset');

    Route::post('vendor/reset-password', [VendorNewPasswordController::class, 'store'])
        ->name('vendor.password.store');

    // Route::get('register', [RegisteredUserController::class, 'create'])
    //     ->name('register');

    // Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
});

Route::middleware('auth')->group(function () {
    Route::get('vendor/profile', [VendorProfileController::class, 'edit'])
        ->name('vendor.profile.edit');
    Route::put('vendor/profile', [VendorProfileController::class, 'update'])
        ->name('vendor.profile.update');
    Route::get('vendor/profile/bank-account', [VendorProfileController::class, 'bankAccount'])
        ->name('vendor.profile.bank-account');

    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');

    Route::post('vendor/logout', [VendorAuthenticatedSessionController::class, 'destroy'])
        ->name('vendor.logout');
});
