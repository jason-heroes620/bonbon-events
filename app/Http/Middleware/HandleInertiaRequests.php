<?php

namespace App\Http\Middleware;

use App\Models\Vendors;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $vendor = null;

        if ($user && ($user->role ?? null) === 'vendor') {
            $vendor = Vendors::query()
                ->where('user_id', $user->user_id)
                ->first(['vendor_id']);
        }

        return [
            ...parent::share($request),
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
                'status' => fn() => $request->session()->get('status'),
            ],
            'auth' => [
                'user' => $user,
                'vendor' => $vendor,
            ],
        ];
    }
}
