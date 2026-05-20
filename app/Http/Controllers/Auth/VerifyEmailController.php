<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        $defaultRedirect = route('dashboard', absolute: false);
        $redirect = $request->query('redirect');

        if (is_string($redirect) && $redirect !== '' && str_starts_with($redirect, '/')) {
            $defaultRedirect = $redirect;
        }

        if (($request->user()->role ?? null) === 'vendor') {
            $defaultRedirect = '/';
        }

        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended($defaultRedirect.'?verified=1');
        }

        if ($request->user()->markEmailAsVerified()) {
            event(new Verified($request->user()));
            $request->user()->forceFill(['is_active' => true])->save();
        }

        return redirect()->intended($defaultRedirect.'?verified=1');
    }
}
