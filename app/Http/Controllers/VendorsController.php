<?php

namespace App\Http\Controllers;

use App\Events\NewVendorRegistration;
use App\Mail\NewVendorRegistrationEmail;
use App\Mail\VendorApprovedMail;
use App\Mail\VendorRejectedMail;
use App\Models\Categories;
use App\Models\User;
use App\Models\Vendors;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

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

            $vendor = Vendors::create([
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
                'is_active' => false,
            ]);

            try {
                Mail::to(
                    [
                        'felicia.n@bonbon.com.my',
                        'elijah.k@bonbon.com.my',
                        'jason.w@bonbon.com.my',
                    ]
                )
                    ->later(now()->addMinute(), new NewVendorRegistrationEmail($vendor));
            } catch (Throwable $ex) {
                Log::error($ex);
            }

            return $user;
        });

        $user->sendVendorEmailVerificationNotification();

        return redirect('/')->with('success', 'Vendor registration successful. Please verify your email.');
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
            ->where('is_verified', true)
            ->where('is_active', true)
            ->first();

        // Check if vendor is approved
        if ($user->vendor->vendor_status !== 'approved') {
            return back()->withError('Vendor account is not approved.');
        }

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

        // return Inertia::render('Home', [
        //     'user' => $user,
        // ]);
        return redirect()->back();
    }


    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $rawStatus = $request->string('status')->toString();
        $vendorStatus = in_array($rawStatus, ['pending', 'approved', 'rejected'], true)
            ? $rawStatus
            : null;

        $vendors = Vendors::query()
            ->with(['user:user_id,name,email'])
            ->when($vendorStatus !== null, function ($query) use ($vendorStatus) {
                $query->where('vendor_status', $vendorStatus);
            })
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
            ->orderByRaw("
                CASE vendor_status
                    WHEN 'pending' THEN 1
                    WHEN 'approved' THEN 2
                    WHEN 'rejected' THEN 3
                    ELSE 4
                END
            ")
            ->orderBy('vendor_name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('vendors/vendors', [
            'vendors' => $vendors,
            'filters' => [
                'search' => $search,
                'status' => $vendorStatus ?? 'all',
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
            'is_active' => (bool) ($validated['is_active'] ?? false),
        ]);

        return redirect('/vendors');
    }

    public function edit(Request $request, Vendors $vendor): Response
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
            'return_to_vendors_query' => $this->buildReturnToVendorsQuery($request),
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
            'return_search' => ['nullable', 'string', 'max:255'],
            'return_status' => ['nullable', 'string', 'max:32'],
            'return_page' => ['nullable', 'integer', 'min:1'],
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

        return redirect($this->buildReturnToVendorsUrlFromPayload($validated));
    }

    public function destroy(Request $request, Vendors $vendor)
    {
        Vendors::query()
            ->where('vendor_id', $vendor->vendor_id)
            ->delete();

        return redirect($this->buildReturnToVendorsUrlFromPayload($request->only([
            'return_search',
            'return_status',
            'return_page',
        ])));
    }

    public function approve(Request $request, Vendors $vendor)
    {
        User::query()
            ->where('user_id', $vendor->user_id)
            ->update([
                'is_active' => true,
            ]);

        $vendor->update([
            'vendor_status' => 'approved',
            'is_active' => true,
        ]);

        try {
            Mail::to([$vendor->vendor_email, 'test@bonbon.com.my'])
                ->queue((new VendorApprovedMail($vendor))->delay(now()->addMinutes(1)));
        } catch (\Exception $e) {
            report($e);
        }

        return redirect($this->buildReturnToVendorsUrlFromPayload($request->only([
            'return_search',
            'return_status',
            'return_page',
        ])));
    }

    public function reject(Request $request, Vendors $vendor)
    {
        User::query()
            ->where('user_id', $vendor->user_id)
            ->update([
                'is_active' => false,
            ]);
        $vendor->update([
            'vendor_status' => 'rejected',
        ]);
        try {
            Mail::to([$vendor->vendor_email, 'test@bonbon.com.my'])
                ->queue((new VendorRejectedMail($vendor))->delay(now()->addMinutes(1)));
        } catch (\Exception $e) {
            report($e);
        }

        return redirect($this->buildReturnToVendorsUrlFromPayload($request->only([
            'return_search',
            'return_status',
            'return_page',
        ])));
    }

    /**
     * @return array{search:?string, status:?string, page:?int}
     */
    private function buildReturnToVendorsQuery(Request $request): array
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $page = $request->query('page');

        $searchNormalized = is_string($search) && trim($search) !== '' ? trim($search) : null;
        $statusNormalized = is_string($status) && in_array($status, ['pending', 'approved', 'rejected'], true)
            ? $status
            : null;
        $pageNormalized = null;
        if (is_numeric($page)) {
            $pageInt = (int) $page;
            if ($pageInt > 1) {
                $pageNormalized = $pageInt;
            }
        }

        return [
            'search' => $searchNormalized,
            'status' => $statusNormalized,
            'page' => $pageNormalized,
        ];
    }

    /**
     * @param array{return_search?:mixed, return_status?:mixed, return_page?:mixed} $payload
     */
    private function buildReturnToVendorsUrlFromPayload(array $payload): string
    {
        $search = $payload['return_search'] ?? null;
        $status = $payload['return_status'] ?? null;
        $page = $payload['return_page'] ?? null;

        $searchNormalized = is_string($search) && trim($search) !== '' ? trim($search) : null;
        $statusNormalized = is_string($status) && in_array($status, ['pending', 'approved', 'rejected'], true)
            ? $status
            : null;
        $pageNormalized = null;
        if (is_numeric($page)) {
            $pageInt = (int) $page;
            if ($pageInt > 1) {
                $pageNormalized = $pageInt;
            }
        }

        $query = [];
        if ($searchNormalized !== null) {
            $query['search'] = $searchNormalized;
        }
        if ($statusNormalized !== null) {
            $query['status'] = $statusNormalized;
        }
        if ($pageNormalized !== null) {
            $query['page'] = $pageNormalized;
        }

        if (count($query) === 0) {
            return '/vendors';
        }

        return '/vendors?' . http_build_query($query);
    }
}
