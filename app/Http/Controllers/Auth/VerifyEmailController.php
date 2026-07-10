<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VerifyEmailController extends Controller
{
    /**
     * Mark the user's email address as verified.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        $routeId = (string) $request->route('id');
        $routeHash = (string) $request->route('hash');

        $authedUser = $request->user();

        if ($authedUser && (string) $authedUser->getKey() !== $routeId) {
            abort(403);
        }

        $user = $authedUser ?: User::query()->whereKey($routeId)->first();

        if (!$user) {
            abort(404);
        }

        if (!hash_equals($routeHash, sha1($user->getEmailForVerification()))) {
            abort(403);
        }

        if (!$user->hasVerifiedEmail()) {
            if ($user->markEmailAsVerified()) {
                event(new Verified($user));
                $user->forceFill(['is_active' => true])->save();
            }
        }

        if (!$authedUser) {
            if (($user->role ?? null) === 'vendor') {
                return redirect('/')->with('status', 'Email verified. Please log in.');
            }

            return redirect()->route('login')->with('status', 'Email verified. We will notify you once your account is activated.');
        }

        $defaultRedirect = route('dashboard.index', absolute: false);
        $redirect = $request->query('redirect');

        if (is_string($redirect) && $redirect !== '' && str_starts_with($redirect, '/')) {
            $defaultRedirect = $redirect;
        }

        if (($user->role ?? null) === 'vendor') {
            $defaultRedirect = '/';
        }

        return redirect()->intended($defaultRedirect . '?verified=1');
    }
}
