<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RejectVendorAccess
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();

        if ($user && ($user->role ?? null) === 'vendor') {
            return redirect('/');
        }

        return $next($request);
    }
}

