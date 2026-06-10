<?php

namespace App\Http\Controllers;

use App\Models\Categories;
use App\Models\User;
use App\Models\Vendors;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class VendorsController extends Controller
{
    public function register(): Response
    {
        $categories = Categories::query()
            ->where('is_active', true)
            ->orderBy('category_name', 'asc')
            ->get(['category_id', 'category_name']);

        return Inertia::render('VendorRegister', [
            'categories' => $categories,
        ]);
    }

    public function storeRegistration(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'vendor_name' => ['required', 'string', 'max:255'],
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

        $user = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['vendor_contact_person'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'is_active' => false,
                'role' => 'vendor',
            ]);

            Vendors::create([
                'user_id' => $user->user_id,
                'vendor_name' => $validated['vendor_name'],
                'vendor_email' => $validated['email'],
                'vendor_contact_person' => $validated['vendor_contact_person'],
                'vendor_contact_no' => $validated['vendor_contact_no'],
                'business_name' => $validated['business_name'],
                'business_registration_no' => $validated['business_registration_no'],
                'business_description' => $validated['business_description'],
                'social_medias' => $validated['social_medias'] ?? [],
                'category' => $validated['category'],
                'vendor_bank_name' => $validated['vendor_bank_name'] ?? '',
                'vendor_bank_account_no' => $validated['vendor_bank_account_no'] ?? '',
                'vendor_bank_account_name' => $validated['vendor_bank_account_name'] ?? '',
                'is_active' => true,
            ]);

            return $user;
        });

        $user->sendVendorEmailVerificationNotification();

        return redirect('/')->withSuccess('Vendor registration successful!');
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('email', $validated['email'])
            ->where('role', 'vendor')
            ->where('is_active', true)
            ->first();

        if (!$user) {
            return back()->withError('Email not found.');
        }

        if (!Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Password is incorrect.',
            ], 201);
        }

        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();

        return Inertia::render('Home', [
            'user' => $user,
        ]);
    }


    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $vendors = Vendors::query()
            ->with(['user:user_id,name,email'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('vendor_name', 'like', "%{$search}%")
                        ->orWhere('vendor_email', 'like', "%{$search}%")
                        ->orWhere('vendor_contact_person', 'like', "%{$search}%")
                        ->orWhere('vendor_contact_no', 'like', "%{$search}%")
                        ->orWhere('business_registration_no', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->orderBy('vendor_name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('vendors/vendors', [
            'vendors' => $vendors,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        $users = User::query()
            ->orderBy('name', 'asc')
            ->get(['user_id', 'name', 'email']);

        $categories = Categories::query()
            ->where('is_active', true)
            ->orderBy('category_name', 'asc')
            ->get(['category_id', 'category_name']);

        return Inertia::render('vendors/create', [
            'users' => $users,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,user_id'],
            'vendor_name' => ['required', 'string', 'max:255'],
            'vendor_email' => ['required', 'email', 'max:255'],
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
            'is_active' => ['nullable', 'boolean'],
        ]);

        Vendors::create([
            'user_id' => $validated['user_id'],
            'vendor_name' => $validated['vendor_name'],
            'vendor_email' => $validated['vendor_email'],
            'vendor_contact_person' => $validated['vendor_contact_person'],
            'vendor_contact_no' => $validated['vendor_contact_no'],
            'business_name' => $validated['business_name'],
            'business_registration_no' => $validated['business_registration_no'],
            'business_description' => $validated['business_description'],
            'social_medias' => $validated['social_medias'] ?? [],
            'category' => $validated['category'],
            'vendor_bank_name' => $validated['vendor_bank_name'],
            'vendor_bank_account_no' => $validated['vendor_bank_account_no'],
            'vendor_bank_account_name' => $validated['vendor_bank_account_name'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect('/vendors');
    }

    public function edit(Vendors $vendor): Response
    {
        $users = User::query()
            ->orderBy('name', 'asc')
            ->get(['user_id', 'name', 'email']);

        $categories = Categories::query()
            ->where('is_active', true)
            ->orderBy('category_name', 'asc')
            ->get(['category_id', 'category_name']);

        $vendor->load(['user:user_id,name,email']);

        return Inertia::render('vendors/[id]', [
            'vendor' => $vendor,
            'users' => $users,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Vendors $vendor)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,user_id'],
            'vendor_name' => ['required', 'string', 'max:255'],
            'vendor_email' => ['required', 'email', 'max:255'],
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
            'is_active' => ['nullable', 'boolean'],
        ]);

        $vendor->update([
            'user_id' => $validated['user_id'],
            'vendor_name' => $validated['vendor_name'],
            'vendor_email' => $validated['vendor_email'],
            'vendor_contact_person' => $validated['vendor_contact_person'],
            'vendor_contact_no' => $validated['vendor_contact_no'],
            'business_name' => $validated['business_name'],
            'business_registration_no' => $validated['business_registration_no'],
            'business_description' => $validated['business_description'],
            'social_medias' => $validated['social_medias'] ?? [],
            'category' => $validated['category'],
            'vendor_bank_name' => $validated['vendor_bank_name'],
            'vendor_bank_account_no' => $validated['vendor_bank_account_no'],
            'vendor_bank_account_name' => $validated['vendor_bank_account_name'],
            'is_active' => (bool) ($validated['is_active'] ?? false),
        ]);

        return redirect('/vendors');
    }

    public function destroy(Vendors $vendor)
    {
        Vendors::query()
            ->where('vendor_id', $vendor->vendor_id)
            ->delete();

        return redirect('/vendors');
    }
}
