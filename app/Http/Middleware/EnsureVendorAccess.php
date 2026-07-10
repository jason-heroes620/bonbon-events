<?php

namespace App\Http\Middleware;

use App\Models\Vendors;
use Closure;
use Illuminate\Http\Request;

class EnsureVendorAccess
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();

        if (!$user) {
            return redirect('/vendor/login');
        }

        if (($user->role ?? null) !== 'vendor') {
            return redirect('/dashboard');
        }

        $vendorExists = Vendors::query()
            ->where('user_id', $user->user_id)
            ->exists();

        if (!$vendorExists) {
            return redirect('/vendor/profile');
        }

        return $next($request);
    }
}

