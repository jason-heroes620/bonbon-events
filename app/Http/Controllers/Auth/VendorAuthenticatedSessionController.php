<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Vendors;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class VendorAuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('vendor.password.request'),
            'status' => session('status'),
            'postUrl' => '/vendor/login',
            'forgotPasswordRouteName' => 'vendor.password.request',
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = $request->user();

        if (($user->role ?? null) !== 'vendor') {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/')->with('status', 'Only vendor accounts can log in here.');
        }

        if (!$user->hasVerifiedEmail()) {
            return redirect()->intended(route('verification.notice'));
        }

        if (!$user->is_active) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/')->with('status', 'Your account is inactive.');
        }

        // Check if vendor is approved
        $vendor = Vendors::query()
            ->where('user_id', '=', $user->user_id)->first();
        if (!$vendor || $vendor->vendor_status !== 'approved') {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/')->with('error', 'Vendor account is not approved yet. Please allow 3-5 business days for us to get back to you. Thank you.');
        }

        return redirect()->back();
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
