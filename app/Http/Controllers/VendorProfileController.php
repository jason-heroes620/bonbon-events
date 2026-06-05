<?php

namespace App\Http\Controllers;

use App\Models\Categories;
use App\Models\Vendors;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class VendorProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user && ($user->role ?? null) === 'vendor', 403);

        $vendor = Vendors::query()
            ->where('user_id', $user->user_id)
            ->firstOrFail();

        $categories = Categories::query()
            ->where('is_active', true)
            ->orderBy('category_name', 'asc')
            ->get(['category_id', 'category_name']);

        return Inertia::render('vendor/profile', [
            'vendor' => $vendor,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && ($user->role ?? null) === 'vendor', 403);

        $vendor = Vendors::query()
            ->where('user_id', $user->user_id)
            ->firstOrFail();

        $validated = $request->validate([
            'vendor_name' => ['required', 'string', 'max:255'],
            'vendor_email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                'unique:users,email,' . $user->user_id . ',user_id',
            ],
            'vendor_contact_person' => ['required', 'string', 'max:255'],
            'vendor_contact_no' => ['required', 'string', 'max:255'],
            'business_name' => ['nullable', 'string', 'max:255'],
            'business_registration_no' => ['required', 'string', 'max:255'],
            'business_description' => ['required', 'string'],
            'category' => ['required', 'array', 'min:1'],
            'category.*' => ['required', 'uuid', 'exists:categories,category_id'],
            'social_medias' => ['nullable', 'array'],
            'social_medias.instagram' => ['nullable', 'string', 'max:255'],
            'social_medias.facebook' => ['nullable', 'string', 'max:255'],
            'social_medias.youtube' => ['nullable', 'string', 'max:255'],
            'social_medias.tiktok' => ['nullable', 'string', 'max:255'],
            'social_medias.xiaohongshu' => ['nullable', 'string', 'max:255'],
            'vendor_bank_name' => ['nullable', 'string', 'max:255'],
            'vendor_bank_account_no' => ['nullable', 'string', 'max:255'],
            'vendor_bank_account_name' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($user, $vendor, $validated) {
            $user->fill([
                'name' => $validated['vendor_contact_person'],
                'email' => $validated['vendor_email'],
            ]);

            if ($user->isDirty('email')) {
                $user->email_verified_at = null;
            }

            $user->save();

            $vendor->update([
                'vendor_name' => $validated['vendor_name'],
                'vendor_email' => $validated['vendor_email'],
                'vendor_contact_person' => $validated['vendor_contact_person'],
                'vendor_contact_no' => $validated['vendor_contact_no'],
                'business_name' => $validated['business_name'],
                'business_registration_no' => $validated['business_registration_no'],
                'business_description' => $validated['business_description'],
                'social_medias' => $validated['social_medias'] ?? [],
                'category' => $validated['category'],
                'vendor_bank_name' => $validated['vendor_bank_name'] ?? null,
                'vendor_bank_account_no' => $validated['vendor_bank_account_no'] ?? null,
                'vendor_bank_account_name' => $validated['vendor_bank_account_name'] ?? null,
            ]);
        });

        return redirect()->back()->withSuccess('Profile updated successfully');
    }

    public function bankAccount(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user && ($user->role ?? null) === 'vendor', 403);

        $vendor = Vendors::query()
            ->where('user_id', $user->user_id)
            ->firstOrFail();
        if (!$vendor->vendor_bank_account_name) {
            return response()->json(['data' => false]);
        }
        return response()->json(['data' => true]);
    }
}
