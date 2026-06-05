<?php

namespace App\Http\Controllers;

use App\Mail\ApplicationApprovedPaymentLink;
use App\Mail\ApplicationRejectedEmail;
use App\Models\Applications;
use App\Models\ApplicationBooths;
use App\Models\Booths;
use App\Models\EventBooths;
use App\Models\EventDeposits;
use App\Models\Invoices;
use App\Models\OrderItems;
use App\Models\Orders;
use App\Models\Categories;
use App\Models\Events;
use App\Models\Vendors;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationsController extends Controller
{
    public function __construct(private InvoiceService $invoiceService)
    {
    }

    public function participate(Request $request, Events $event)
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'uuid'],
            'vendor_id' => ['nullable', 'uuid'],
            'participants' => ['required', 'integer', 'min:1', 'max:127'],
            'no_of_booths' => ['required', 'integer', 'min:1', 'max:127'],
            'requirements' => ['nullable', 'string', 'max:1000'],
            'plug' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();

        if (($user->role ?? null) !== 'vendor') {
            return response()->json([
                'message' => 'Only vendor users can participate in events.',
            ], 403);
        }

        $vendor = Vendors::query()
            ->where('user_id', $user->user_id)
            ->first();

        if (!$vendor) {
            return response()->json([
                'message' => 'Vendor profile not found.',
            ], 422);
        }

        if (!empty($validated['user_id']) && $validated['user_id'] !== $user->user_id) {
            return response()->json([
                'message' => 'User mismatch.',
            ], 403);
        }

        if (!empty($validated['vendor_id']) && $validated['vendor_id'] !== $vendor->vendor_id) {
            return response()->json([
                'message' => 'Vendor mismatch.',
            ], 403);
        }

        $existing = Applications::query()
            ->where('event_id', $event->event_id)
            ->where('vendor_id', $vendor->vendor_id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You have already participated in this event.',
            ], 409);
        }

        $categoryValue = '';
        if (is_array($vendor->category)) {
            $categoryValue = implode(',', $vendor->category);
        } elseif (is_string($vendor->category)) {
            $categoryValue = $vendor->category;
        }
        $categoryValue = substr($categoryValue, 0, 255);

        $application = Applications::create([
            'user_id' => $user->user_id,
            'vendor_id' => $vendor->vendor_id,
            'event_id' => $event->event_id,
            'application_code' => Str::upper(Str::random(8)),
            'participants' => $validated['participants'],
            'no_of_booths' => $validated['no_of_booths'],
            'requirements' => $validated['requirements'] ?? null,
            'plug' => (bool) ($validated['plug'] ?? false),
            'application_status' => 'pending',
        ]);

        return response()->json([
            'application_id' => $application->application_id,
            'vendor_id' => $vendor->vendor_id,
            'user_id' => $user->user_id,
        ], 201);
    }

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $applications = Applications::query()
            ->with(['event', 'vendor', 'order'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('application_code', 'like', "%{$search}%")
                        ->orWhere('organization', 'like', "%{$search}%")
                        ->orWhere('contact_person', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('application_status', 'like', "%{$search}%")
                        ->orWhereHas('event', function ($query) use ($search) {
                            $query->where('event_name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('applications/applications', [
            'applications' => $applications,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        $events = Events::query()
            ->orderByDesc('event_start_date')
            ->get(['event_id', 'event_name', 'require_deposit']);
        $categories = Categories::query()
            ->where('is_active', true)
            ->orderBy('category_name', 'asc')
            ->get(['category_id', 'category_name']);

        $vendors = Vendors::query()
            ->where('is_active', true)
            ->orderBy('vendor_name', 'asc')
            ->get([
                'vendor_id',
                'vendor_name',
                'vendor_email',
                'vendor_contact_person',
                'vendor_contact_no',
                'business_registration_no',
                'business_description',
                'category',
                'social_medias',
                'vendor_bank_name',
                'vendor_bank_account_no',
                'vendor_bank_account_name',
            ]);

        return Inertia::render('applications/create', [
            'events' => $events,
            'categories' => $categories,
            'vendors' => $vendors,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'uuid', 'exists:events,event_id'],
            'vendor_id' => ['required', 'uuid', 'exists:vendors,vendor_id'],
            'participants' => ['required', 'integer', 'min:1', 'max:127'],
            'no_of_booths' => ['required', 'integer', 'min:1', 'max:127'],
            'category' => ['required', 'string', 'max:255'],
            'requirements' => ['nullable', 'string'],
            'plug' => ['nullable', 'boolean'],
            'application_status' => ['nullable', 'in:pending,approved,rejected,cancelled'],
        ]);

        Applications::create([
            'event_id' => $validated['event_id'],
            'vendor_id' => $validated['vendor_id'],
            'application_code' => Str::upper(Str::random(8)),
            'participants' => $validated['participants'],
            'no_of_booths' => $validated['no_of_booths'],
            'requirements' => $validated['requirements'] ?? null,
            'plug' => (bool) ($validated['plug'] ?? false),
            'application_status' => $validated['application_status'] ?? 'pending',
        ]);

        return redirect('/applications');
    }

    public function edit(Applications $application): Response
    {
        $event = Events::query()
            ->where('event_id', $application->event_id)
            ->first(['event_id', 'event_name', 'require_deposit']);

        $depositAmount = '0';
        if ($event && $event->require_deposit) {
            $depositAmount = (string) (EventDeposits::query()
                ->leftJoin('deposits', 'event_deposits.deposit_id', '=', 'deposits.deposit_id')
                ->where('event_deposits.event_id', $application->event_id)
                ->where('event_deposits.event_deposit_status', 'active')
                ->orderByDesc('event_deposits.created_at')
                ->value('deposits.deposit_amount') ?? '0');
        }

        $vendor = Vendors::query()
            ->where('vendor_id', $application->vendor_id)
            ->first(
                [
                    'vendor_name',
                    'vendor_contact_person',
                    'vendor_contact_no',
                    'vendor_email',
                    'business_description',
                    'category',
                    'social_medias'
                ]
            );

        $categories = Categories::query()
            ->where('is_active', true)
            ->orderBy('category_name', 'asc')
            ->get(['category_id', 'category_name']);

        $selectedBoothIds = ApplicationBooths::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->pluck('booth_id')
            ->filter()
            ->values();

        $selectedEventBoothIds = EventBooths::query()
            ->where('event_id', $application->event_id)
            ->whereIn('booth_id', $selectedBoothIds)
            ->pluck('event_booth_id')
            ->values();

        $eventBooths = EventBooths::query()
            ->leftJoin('booths', 'event_booths.booth_id', '=', 'booths.booth_id')
            ->leftJoin('booth_types', 'booths.booth_type_id', '=', 'booth_types.booth_type_id')
            ->where('event_booths.event_id', $application->event_id)
            ->where('event_booths.is_active', true)
            ->orderBy('booth_types.booth_type_name')
            ->orderBy('booths.booth_name')
            ->get([
                'event_booths.event_booth_id',
                'event_booths.booth_id',
                'event_booths.booth_price',
                'event_booths.occupied',
                'booths.booth_name',
                'booths.booth_type_id',
                'booth_types.booth_type_name',
            ]);

        $order = Orders::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->first(['order_id', 'order_no', 'total_price', 'discount_price', 'is_paid', 'created_at']);

        $invoice = null;
        if ($order) {
            $invoice = Invoices::query()
                ->where('order_id', $order->order_id)
                ->orderByDesc('created_at')
                ->first(['invoice_id', 'invoice_no', 'invoice_status', 'invoice_amount']);
        }

        $application->load(['event']);
        $application->load(['vendor']);

        return Inertia::render('applications/[id]', [
            'application' => $application,
            'event' => $event,
            'vendor' => $vendor,
            'categories' => $categories,
            'eventBooths' => $eventBooths,
            'selectedEventBoothIds' => $selectedEventBoothIds,
            'order' => $order,
            'invoice' => $invoice,
            'depositAmount' => $depositAmount,
        ]);
    }

    public function updateStatus(Request $request, Applications $application)
    {
        $validated = $request->validate([
            'application_status' => ['required', 'in:pending,approved,rejected,cancelled'],
        ]);

        $vendor = Vendors::query()
            ->where('vendor_id', $application->vendor_id)
            ->first(['vendor_email', 'vendor_contact_person']);
        $event = Events::query()
            ->where('event_id', $application->event_id)
            ->first(['event_name']);

        if ($validated['application_status'] === 'rejected') {
            if (!$vendor || !$vendor->vendor_email) {
                throw ValidationException::withMessages([
                    'vendor' => ['Vendor email not found.'],
                ]);
            }
            Log::info('rejected mail');
            if (!$event) {
                throw ValidationException::withMessages([
                    'event' => ['Event not found.'],
                ]);
            }

            try {
                Log::info('try send');
                Log::info($vendor);
                Log::info($event);
                Log::info($application);
                Mail::to($vendor->vendor_email)->queue(
                    (new ApplicationRejectedEmail(
                        $application->application_code,
                        $vendor->vendor_contact_person,
                        $event->event_name,
                    ))
                        ->delay(now()),
                );
            } catch (\Exception $e) {
                throw new \Exception($e->getMessage());
            }
        }

        $application->update([
            'application_status' => $validated['application_status'],
        ]);

        return redirect()->back();
    }

    public function generateInvoice(Applications $application)
    {
        if (($application->application_status ?? null) !== 'approved') {
            throw ValidationException::withMessages([
                'application_status' => ['Only approved applications can generate invoice.'],
            ]);
        }

        $order = Orders::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->first();

        if (!$order) {
            throw ValidationException::withMessages([
                'order' => ['Order not found. Please confirm booths first.'],
            ]);
        }

        $this->invoiceService->upsertInvoiceForOrder($order, $application);

        return redirect()->back();
    }

    public function sendPaymentReminder(Applications $application)
    {
        $order = Orders::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->first(['order_id', 'order_no', 'total_price', 'is_paid', 'created_at']);

        if (!$order) {
            throw ValidationException::withMessages([
                'order' => ['Order not found. Please confirm booths first.'],
            ]);
        }

        if ($order->is_paid) {
            throw ValidationException::withMessages([
                'order' => ['Order is already paid.'],
            ]);
        }

        $vendor = Vendors::query()
            ->where('vendor_id', $application->vendor_id)
            ->first(['vendor_id', 'vendor_email', 'vendor_name']);

        if (!$vendor || !$vendor->vendor_email) {
            throw ValidationException::withMessages([
                'vendor' => ['Vendor email not found.'],
            ]);
        }

        $orderDate = $order->created_at ? $order->created_at->toDateString() : '';
        $amount = (string) $order->total_price;

        Mail::raw(
            "Payment reminder\n\nOrder No: {$order->order_no}\nOrder Date: {$orderDate}\nAmount: {$amount}\n\nPlease make payment at your earliest convenience.",
            function ($message) use ($vendor, $order) {
                $message->to($vendor->vendor_email)
                    ->subject("Payment Reminder - {$order->order_no}");
            },
        );

        return redirect()->back();
    }

    public function confirmBooths(Request $request, Applications $application)
    {
        if (($application->application_status ?? null) !== 'approved') {
            throw ValidationException::withMessages([
                'event_booth_ids' => ['Only approved applications can confirm booths.'],
            ]);
        }

        $validated = $request->validate([
            'event_booth_ids' => ['required', 'array', 'size:' . (int) $application->no_of_booths],
            'event_booth_ids.*' => ['required', 'uuid'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $eventBoothIds = array_values(array_unique($validated['event_booth_ids']));
        if (count($eventBoothIds) !== (int) $application->no_of_booths) {
            throw ValidationException::withMessages([
                'event_booth_ids' => ['Duplicate booths detected. Please select again.'],
            ]);
        }

        $discountPrice = (float) ($validated['discount_price'] ?? 0);

        DB::transaction(function () use ($application, $eventBoothIds, $discountPrice) {
            $order = Orders::query()
                ->where('application_id', $application->application_id)
                ->where('is_active', true)
                ->orderByDesc('created_at')
                ->first();

            if ($order && $order->is_paid) {
                throw ValidationException::withMessages([
                    'event_booth_ids' => ['This application has a paid order and cannot be changed.'],
                ]);
            }

            $existingBoothIds = ApplicationBooths::query()
                ->where('application_id', $application->application_id)
                ->where('is_active', true)
                ->pluck('booth_id')
                ->filter()
                ->values();

            $selectedEventBooths = EventBooths::query()
                ->where('event_id', $application->event_id)
                ->whereIn('event_booth_id', $eventBoothIds)
                ->where('is_active', true)
                ->get(['event_booth_id', 'booth_id', 'booth_price', 'occupied']);

            if ($selectedEventBooths->count() !== count($eventBoothIds)) {
                throw ValidationException::withMessages([
                    'event_booth_ids' => ['One or more selected booths are invalid for this event.'],
                ]);
            }

            $existingBoothIdSet = array_fill_keys($existingBoothIds->all(), true);
            foreach ($selectedEventBooths as $eventBooth) {
                if ($eventBooth->occupied && empty($existingBoothIdSet[$eventBooth->booth_id])) {
                    throw ValidationException::withMessages([
                        'event_booth_ids' => ['One or more selected booths are already occupied.'],
                    ]);
                }
            }

            if ($existingBoothIds->isNotEmpty()) {
                EventBooths::query()
                    ->where('event_id', $application->event_id)
                    ->whereIn('booth_id', $existingBoothIds)
                    ->update(['occupied' => false]);
            }

            ApplicationBooths::query()
                ->where('application_id', $application->application_id)
                ->delete();

            foreach ($selectedEventBooths as $eventBooth) {
                ApplicationBooths::create([
                    'application_id' => $application->application_id,
                    'booth_id' => $eventBooth->booth_id,
                    'is_active' => true,
                ]);
            }

            EventBooths::query()
                ->where('event_id', $application->event_id)
                ->whereIn('event_booth_id', $eventBoothIds)
                ->update(['occupied' => true]);

            $event = Events::query()
                ->where('event_id', $application->event_id)
                ->first(['event_id', 'require_deposit']);

            $depositTotal = 0.0;
            if ($event && $event->require_deposit) {
                $depositValue = (string) (EventDeposits::query()
                    ->leftJoin('deposits', 'event_deposits.deposit_id', '=', 'deposits.deposit_id')
                    ->where('event_deposits.event_id', $application->event_id)
                    ->where('event_deposits.event_deposit_status', 'active')
                    ->orderByDesc('event_deposits.created_at')
                    ->value('deposits.deposit_amount') ?? '0');
                $depositTotal = (float) $depositValue;
            }

            $boothTotal = (float) $selectedEventBooths->sum('booth_price');
            $total = $depositTotal + $boothTotal - $discountPrice;
            if ($total < 0) {
                throw ValidationException::withMessages([
                    'discount_price' => ['Discount cannot exceed deposit + booth total.'],
                ]);
            }

            if (!$order) {
                do {
                    $orderNo = Str::upper(Str::random(10));
                } while (Orders::query()->where('order_no', $orderNo)->exists());

                $order = Orders::create([
                    'order_no' => $orderNo,
                    'application_id' => $application->application_id,
                    'application_code' => $application->application_code,
                    'total_price' => (string) $total,
                    'discount_price' => (string) $discountPrice,
                    'is_paid' => false,
                    'is_active' => true,
                ]);
            } else {
                $order->update([
                    'total_price' => (string) $total,
                    'discount_price' => (string) $discountPrice,
                ]);

                OrderItems::query()
                    ->where('order_id', $order->order_id)
                    ->delete();
            }

            if ($depositTotal > 0) {
                OrderItems::create([
                    'order_id' => $order->order_id,
                    'quantity' => 1,
                    'price' => (string) $depositTotal,
                    'item_description' => 'Deposit',
                    'is_active' => true,
                ]);
            }

            $boothDetails = Booths::query()
                ->leftJoin('booth_types', 'booths.booth_type_id', '=', 'booth_types.booth_type_id')
                ->whereIn('booths.booth_id', $selectedEventBooths->pluck('booth_id'))
                ->get([
                    'booths.booth_id',
                    'booths.booth_name',
                    'booth_types.booth_type_name',
                ])
                ->keyBy('booth_id');

            foreach ($selectedEventBooths as $eventBooth) {
                $detail = $boothDetails->get($eventBooth->booth_id);
                $boothName = $detail?->booth_name ?? 'Booth';
                $boothTypeName = $detail?->booth_type_name ?? 'Booth Type';

                OrderItems::create([
                    'order_id' => $order->order_id,
                    'quantity' => 1,
                    'price' => $eventBooth->booth_price,
                    'item_description' => "{$boothTypeName} - {$boothName}",
                    'is_active' => true,
                ]);
            }
        });

        $user = $request->user();
        $vendor = Vendors::query()
            ->where('vendor_id', $application->vendor_id)
            ->first(['vendor_id', 'vendor_email', 'vendor_name']);

        if ($vendor && $vendor->vendor_email) {
            $event = Events::query()
                ->where('event_id', $application->event_id)
                ->first(['event_id', 'event_name']);
            if (!$event) {
                return redirect()->back();
            }
            $paymentUrl = rtrim((string) config('app.url'), '/') . '/payments/' . $application->application_code;
            Mail::to($vendor->vendor_email)->queue(
                (new ApplicationApprovedPaymentLink(
                    $application->application_code,
                    $paymentUrl,
                    $vendor->vendor_name ?: ($user?->name ?? 'Vendor'),
                    $event,
                ))
                    ->delay(now()->addMinute()),
            );
        }

        return redirect()->back();
    }

    public function releaseBooths(Applications $application)
    {
        DB::transaction(function () use ($application) {
            $existingBoothIds = ApplicationBooths::query()
                ->where('application_id', $application->application_id)
                ->where('is_active', true)
                ->pluck('booth_id')
                ->filter()
                ->values();

            if ($existingBoothIds->isNotEmpty()) {
                EventBooths::query()
                    ->where('event_id', $application->event_id)
                    ->whereIn('booth_id', $existingBoothIds)
                    ->update(['occupied' => false]);
            }

            ApplicationBooths::query()
                ->where('application_id', $application->application_id)
                ->delete();

            $order = Orders::query()
                ->where('application_id', $application->application_id)
                ->where('is_active', true)
                ->orderByDesc('created_at')
                ->first();

            if ($order && !$order->is_paid) {
                $order->update(['is_active' => false]);
                OrderItems::query()
                    ->where('order_id', $order->order_id)
                    ->update(['is_active' => false]);

                Invoices::query()
                    ->where('order_id', $order->order_id)
                    ->update(['invoice_status' => 'canceled']);
            }
        });

        return redirect()->back();
    }

    public function update(Request $request, Applications $application)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'uuid', 'exists:events,event_id'],
            'vendor_id' => ['required', 'uuid', 'exists:vendors,vendor_id'],
            'participants' => ['required', 'integer', 'min:1', 'max:127'],
            'no_of_booths' => ['required', 'integer', 'min:1', 'max:127'],
            'category' => ['required', 'string', 'max:255'],
            'requirements' => ['nullable', 'string'],
            'plug' => ['nullable', 'boolean'],
            'application_status' => ['required', 'in:pending,approved,rejected,cancelled'],
        ]);

        $application->update([
            'event_id' => $validated['event_id'],
            'vendor_id' => $validated['vendor_id'],
            'participants' => $validated['participants'],
            'no_of_booths' => $validated['no_of_booths'],
            'requirements' => $validated['requirements'] ?? null,
            'plug' => (bool) ($validated['plug'] ?? false),
            'application_status' => $validated['application_status'],
        ]);

        return redirect('/applications');
    }

    public function destroy(Applications $application)
    {
        Applications::query()
            ->where('application_id', $application->application_id)
            ->update([
                'application_status' => 'cancelled',
            ]);

        return redirect()->back();
    }
}
