<?php

namespace App\Http\Controllers;

use App\Mail\ApplicationApprovedPaymentLink;
use App\Mail\ApplicationPaymentReminderEmail;
use App\Mail\ApplicationRejectedEmail;
use App\Models\Applications;
use App\Models\ApplicationBooths;
use App\Models\ApplicationEvent;
use App\Models\ActivityLogs;
use App\Models\Booths;
use App\Models\Charges;
use App\Models\EventBooths;
use App\Models\EventDeposits;
use App\Models\Invoices;
use App\Models\OrderCharges;
use App\Models\OrderItems;
use App\Models\Orders;
use App\Models\Payments;
use App\Models\Categories;
use App\Models\Events;
use App\Models\Vendors;
use App\Services\ActivityLogService;
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
    public function __construct(private InvoiceService $invoiceService, private ActivityLogService $activityLogService) {}

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

        $existing = ApplicationEvent::query()
            ->leftJoin('applications', 'application_events.application_id', '=', 'applications.application_id')
            ->where('application_events.event_id', $event->event_id)
            ->where('applications.vendor_id', $vendor->vendor_id)
            ->first(['application_events.application_event_id']);

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
            'application_code' => Str::upper(Str::random(8)),
            'application_status' => 'approved',
        ]);

        ApplicationEvent::create([
            'application_id' => $application->application_id,
            'event_id' => $event->event_id,
            'participants' => $validated['participants'],
            'no_of_booths' => $validated['no_of_booths'],
            'requirements' => $validated['requirements'] ?? null,
            'plug' => (bool) ($validated['plug'] ?? false),
            'application_status' => 'approved',
        ]);

        return response()->json([
            'application_id' => $application->application_id,
            'vendor_id' => $vendor->vendor_id,
            'user_id' => $user->user_id,
        ], 201);
    }

    public function participateMulti(Request $request)
    {
        $validated = $request->validate([
            'events' => ['required', 'array', 'min:1'],
            'events.*.event_id' => ['required', 'uuid', 'exists:events,event_id', 'distinct'],
            'events.*.participants' => ['required', 'integer', 'min:1', 'max:127'],
            'events.*.no_of_booths' => ['required', 'integer', 'min:1', 'max:127'],
            'events.*.requirements' => ['nullable', 'string', 'max:1000'],
            'events.*.plug' => ['nullable', 'boolean'],
            'agree_terms' => ['accepted'],
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

        if (
            empty($vendor->vendor_bank_name) ||
            empty($vendor->vendor_bank_account_name) ||
            empty($vendor->vendor_bank_account_no)
        ) {
            return response()->json([
                'message' => 'Bank account not set. Please update your profile.',
            ], 422);
        }

        $eventIds = collect($validated['events'])
            ->pluck('event_id')
            ->filter()
            ->unique()
            ->values();

        $availableEventIds = Events::query()
            ->whereIn('event_id', $eventIds->all(), 'and', false)
            ->where('is_active', true)
            ->where('event_end_date', '>=', now()->toDateString())
            ->pluck('event_id')
            ->filter()
            ->values();

        if ($availableEventIds->count() !== $eventIds->count()) {
            throw ValidationException::withMessages([
                'events' => ['One or more selected events are not available.'],
            ]);
        }

        $alreadyParticipatedEventIds = ApplicationEvent::query()
            ->leftJoin('applications', 'application_events.application_id', '=', 'applications.application_id')
            ->where('applications.vendor_id', $vendor->vendor_id)
            ->whereIn('application_events.event_id', $eventIds->all(), 'and', false)
            ->pluck('application_events.event_id')
            ->filter()
            ->unique()
            ->values();

        if ($alreadyParticipatedEventIds->isNotEmpty()) {
            return response()->json([
                'message' => 'You have already participated in one or more selected events.',
                'event_ids' => $alreadyParticipatedEventIds,
            ], 409);
        }

        $application = null;

        DB::transaction(function () use ($validated, $user, $vendor, &$application) {
            $application = Applications::create([
                'user_id' => $user->user_id,
                'vendor_id' => $vendor->vendor_id,
                'application_code' => Str::upper(Str::random(8)),
                'application_status' => 'pending',
            ]);

            foreach ($validated['events'] as $eventData) {
                ApplicationEvent::create([
                    'application_id' => $application->application_id,
                    'event_id' => $eventData['event_id'],
                    'participants' => $eventData['participants'],
                    'no_of_booths' => $eventData['no_of_booths'],
                    'requirements' => $eventData['requirements'] ?? null,
                    'plug' => (bool) ($eventData['plug'] ?? false),
                    'application_status' => 'approved',
                ]);
            }
        });

        return response()->json([
            'application_id' => $application?->application_id,
            'application_code' => $application?->application_code,
        ], 201);
    }

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $eventId = $request->string('event_id')->toString();
        $status = $request->string('status')->toString();

        $applications = Applications::query()
            ->with(['events.event', 'vendor', 'order'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('application_code', 'like', "%{$search}%")
                        ->orWhere('application_status', 'like', "%{$search}%")
                        ->orWhereHas('vendor', function ($query) use ($search) {
                            $query->where('vendor_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('events.event', function ($query) use ($search) {
                            $query->where('event_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($eventId !== '', function ($query) use ($eventId) {
                $query->whereHas('events', function ($query) use ($eventId) {
                    $query->where('event_id', $eventId);
                });
            })
            ->when($status !== '', function ($query) use ($status) {
                $query->where('application_status', $status);
            })
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        $events = Events::query()
            ->orderByDesc('event_start_date')
            ->get(['event_id', 'event_name']);

        return Inertia::render('applications/applications', [
            'applications' => $applications,
            'events' => $events,
            'filters' => [
                'search' => $search,
                'event_id' => $eventId !== '' ? $eventId : null,
                'status' => $status !== '' ? $status : null,
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
            'vendor_id' => ['required', 'uuid', 'exists:vendors,vendor_id'],
            'events' => ['required', 'array', 'min:1'],
            'events.*.event_id' => ['required', 'uuid', 'exists:events,event_id', 'distinct'],
            'events.*.participants' => ['required', 'integer', 'min:1', 'max:127'],
            'events.*.no_of_booths' => ['required', 'integer', 'min:1', 'max:127'],
            'events.*.requirements' => ['nullable', 'string', 'max:1000'],
            'events.*.plug' => ['nullable', 'boolean'],
            'application_status' => ['nullable', 'in:pending,approved,rejected,cancelled'],
        ]);

        $application = Applications::create([
            'vendor_id' => $validated['vendor_id'],
            'application_code' => Str::upper(Str::random(8)),
            'application_status' => 'approved',
        ]);

        $status = (string) ($validated['application_status'] ?? 'approved');

        foreach ($validated['events'] as $eventData) {
            ApplicationEvent::create([
                'application_id' => $application->application_id,
                'event_id' => $eventData['event_id'],
                'participants' => $eventData['participants'],
                'no_of_booths' => $eventData['no_of_booths'],
                'requirements' => $eventData['requirements'] ?? null,
                'plug' => (bool) ($eventData['plug'] ?? false),
                'application_status' => 'approved',
            ]);
        }

        return redirect('/applications');
    }

    public function edit(Applications $application): Response
    {
        $vendor = Vendors::query()
            ->where('vendor_id', $application->vendor_id)
            ->first(
                [
                    'vendor_id',
                    'vendor_name',
                    'vendor_contact_person',
                    'vendor_contact_no',
                    'vendor_email',
                    'business_registration_no',
                    'business_description',
                    'category',
                    'social_medias',
                    'vendor_bank_name',
                    'vendor_bank_account_name',
                    'vendor_bank_account_no',
                ]
            );

        $categories = Categories::query()
            ->where('is_active', true)
            ->orderBy('category_name', 'asc')
            ->get(['category_id', 'category_name']);

        $applicationEvents = ApplicationEvent::query()
            ->leftJoin('events', 'application_events.event_id', '=', 'events.event_id')
            ->where('application_events.application_id', $application->application_id)
            ->orderBy('events.event_start_date', 'asc')
            ->orderBy('events.event_name', 'asc')
            ->get([
                'application_events.application_event_id',
                'application_events.application_id',
                'application_events.event_id',
                'application_events.participants',
                'application_events.no_of_booths',
                'application_events.requirements',
                'application_events.plug',
                'application_events.application_status',
                'events.event_name',
                'events.event_start_date',
                'events.require_deposit',
            ]);

        $depositAmountsByEventId = EventDeposits::query()
            ->leftJoin('deposits', 'event_deposits.deposit_id', '=', 'deposits.deposit_id')
            ->whereIn('event_deposits.event_id', $applicationEvents->pluck('event_id')->unique()->values()->all())
            ->where('event_deposits.event_deposit_status', 'active')
            ->orderByDesc('event_deposits.created_at')
            ->get([
                'event_deposits.event_id',
                'deposits.deposit_amount',
            ])
            ->groupBy('event_id')
            ->map(fn($rows) => (string) ($rows->first()->deposit_amount ?? '0'));

        $selectedBoothsByApplicationEventId = ApplicationBooths::query()
            ->whereIn('application_event_id', $applicationEvents->pluck('application_event_id')->all(), 'and', false)
            ->where('is_active', true)
            ->get(['application_event_id', 'booth_id'])
            ->groupBy('application_event_id')
            ->map(fn($rows) => $rows->pluck('booth_id')->filter()->values());

        $eventBoothsByEventId = EventBooths::query()
            ->leftJoin('booths', 'event_booths.booth_id', '=', 'booths.booth_id')
            ->leftJoin('booth_types', 'booths.booth_type_id', '=', 'booth_types.booth_type_id')
            ->whereIn('event_booths.event_id', $applicationEvents->pluck('event_id')->unique()->values()->all(), 'and', false)
            ->where('event_booths.is_active', true)
            ->orderBy('booth_types.booth_type_name')
            ->orderByRaw('LENGTH(booths.booth_name) ASC, booths.booth_name ASC')
            ->get([
                'event_booths.event_booth_id',
                'event_booths.event_id',
                'event_booths.booth_id',
                'event_booths.booth_price',
                'event_booths.occupied',
                'event_booths.occupied_by_application_event_id',
                'booths.booth_name',
                'booths.booth_type_id',
                'booth_types.booth_type_name',
            ])
            ->groupBy('event_id');

        $applicationEventsView = $applicationEvents->map(function ($row) use ($depositAmountsByEventId, $selectedBoothsByApplicationEventId, $eventBoothsByEventId) {
            $selectedBoothIds = $selectedBoothsByApplicationEventId->get($row->application_event_id) ?? collect();
            $selectedEventBoothIds = EventBooths::query()
                ->where('event_id', $row->event_id)
                ->whereIn('booth_id', $selectedBoothIds)
                ->pluck('event_booth_id')
                ->values();

            $eventBooths = $eventBoothsByEventId->get($row->event_id) ?? collect();
            $requiresDeposit = (bool) ($row->require_deposit ?? false);

            return [
                'application_event_id' => $row->application_event_id,
                'event_id' => $row->event_id,
                'event_name' => $row->event_name,
                'event_start_date' => $row->event_start_date,
                'require_deposit' => $requiresDeposit,
                'deposit_amount' => $requiresDeposit ? ($depositAmountsByEventId->get($row->event_id) ?? '0') : '0',
                'participants' => $row->participants,
                'no_of_booths' => $row->no_of_booths,
                'requirements' => $row->requirements ?? '',
                'plug' => (bool) ($row->plug ?? false),
                'application_status' => $row->application_status,
                'event_booths' => $eventBooths->values(),
                'selected_event_booth_ids' => $selectedEventBoothIds,
            ];
        });

        $order = Orders::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->first(['order_id', 'order_no', 'sub_total', 'discount_price', 'charges_total', 'total_price', 'is_paid', 'created_at']);

        $orderCharges = collect();
        $amountPaid = 0.0;
        if ($order) {
            $orderCharges = OrderCharges::query()
                ->where('order_id', $order->order_id)
                ->orderBy('sort_order')
                ->orderBy('created_at')
                ->get([
                    'order_charge_id',
                    'charges_name',
                    'charges_type',
                    'charges_rate',
                    'charges_amount',
                    'sort_order',
                ]);

            $amountPaid = (float) (Payments::query()
                ->where('order_id', $order->order_id)
                ->sum('payment_amount') ?? 0);
        }

        $invoice = null;
        if ($order) {
            $invoice = Invoices::query()
                ->where('order_id', $order->order_id)
                ->orderByDesc('created_at')
                ->first(['invoice_id', 'invoice_no', 'invoice_status', 'invoice_amount']);
        }

        $activityLogs = ActivityLogs::query()
            ->leftJoin('users', 'activity_logs.user_id', '=', 'users.user_id')
            ->where('application_code', $application->application_code)
            ->orderByDesc('activity_logs.created_at')
            ->get([
                'activity_logs.id',
                'activity_logs.application_code',
                'activity_logs.activity',
                'activity_logs.description',
                'users.name',
                'activity_logs.created_at',
            ]);

        return Inertia::render('applications/[id]', [
            'application' => $application,
            'vendor' => $vendor,
            'categories' => $categories,
            'applicationEvents' => $applicationEventsView,
            'order' => $order,
            'charges' => $orderCharges,
            'amountPaid' => $amountPaid,
            'invoice' => $invoice,
            'activityLogs' => $activityLogs,
        ]);
    }

    public function updateStatus(Request $request, Applications $application)
    {
        Log::info('status changed');
        $validated = $request->validate([
            'application_status' => ['required', 'in:pending,approved,rejected,cancelled'],
        ]);

        $vendor = Vendors::query()
            ->where('vendor_id', $application->vendor_id)
            ->first(['vendor_email', 'vendor_contact_person']);

        $this->activityLogService->logActivity(
            applicationCode: $application->application_code,
            activityType: 'Status Changed',
            activityDescription: 'Status Changed to ' . $validated['application_status'],
            userId: $request->user()->user_id ?? '',
        );

        if ($validated['application_status'] === 'rejected') {
            if (!$vendor || !$vendor->vendor_email) {
                throw ValidationException::withMessages([
                    'vendor' => ['Vendor email not found.'],
                ]);
            }

            try {
                $firstEventName = (string) (ApplicationEvent::query()
                    ->leftJoin('events', 'application_events.event_id', '=', 'events.event_id')
                    ->where('application_events.application_id', $application->application_id)
                    ->orderBy('events.event_start_date', 'asc')
                    ->value('events.event_name') ?? '');

                if ($validated['application_status'] === 'rejected') {
                    Mail::to($vendor->vendor_email)->queue(
                        (new ApplicationRejectedEmail(
                            $application->application_code,
                            $vendor->vendor_contact_person,
                            $firstEventName !== '' ? $firstEventName : 'Event',
                        ))
                            ->delay(now()),
                    );
                }
            } catch (\Exception $e) {
                throw new \Exception($e->getMessage());
            }
        }

        $application->update([
            'application_status' => $validated['application_status'],
        ]);

        ApplicationEvent::query()
            ->where('application_id', $application->application_id)
            ->update([
                'application_status' => $validated['application_status'],
            ]);

        return redirect()->back();
    }

    public function sendPaymentLink(Request $request, Applications $application)
    {
        if (($application->application_status ?? null) !== 'approved') {
            throw ValidationException::withMessages([
                'application' => ['Payment link can only be sent for approved applications.'],
            ]);
        }

        $order = Orders::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->first();

        $this->rebuildOrderForApplication($application, $order ? (float) $order->discount_price : 0.0);

        $this->queueApprovedPaymentLinkEmail($application);

        $this->activityLogService->logActivity(
            applicationCode: $application->application_code,
            activityType: 'Payment Link Sent',
            activityDescription: 'Payment link sent to vendor',
            userId: $request->user()->user_id ?? '',
        );

        return redirect()->back();
    }

    private function queueApprovedPaymentLinkEmail(Applications $application): void
    {
        $vendor = Vendors::query()
            ->where('vendor_id', $application->vendor_id)
            ->first(['vendor_id', 'vendor_email', 'vendor_name']);

        if (!$vendor || !$vendor->vendor_email) {
            throw ValidationException::withMessages([
                'vendor' => ['Vendor email not found.'],
            ]);
        }

        $eventName = ApplicationEvent::query()
            ->leftJoin('events', 'application_events.event_id', '=', 'events.event_id')
            ->where('application_events.application_id', $application->application_id)
            ->orderBy('events.event_start_date', 'asc')
            ->pluck('events.event_name')
            ->filter()
            ->unique()
            ->values()
            ->join(', ');

        if ($eventName === '') {
            $eventName = 'Event';
        }

        $paymentUrl = rtrim((string) config('app.url'), '/') . '/payments/' . $application->application_code;

        Mail::to([$vendor->vendor_email, 'test@bonbon.com.my'])->queue(
            (new ApplicationApprovedPaymentLink(
                $application->application_code,
                $paymentUrl,
                $vendor->vendor_name ?: 'Vendor',
                $eventName,
            ))
                ->delay(now()->addMinute()),
        );
    }

    public function updateEventStatus(Request $request, Applications $application, ApplicationEvent $applicationEvent)
    {
        if ($applicationEvent->application_id !== $application->application_id) {
            abort(404);
        }

        $validated = $request->validate([
            'application_status' => ['required', 'in:pending,approved,rejected,cancelled'],
        ]);

        $applicationEvent->update([
            'application_status' => $validated['application_status'],
        ]);

        return redirect()->back();
    }

    public function updateBoothQtyForEvent(Request $request, Applications $application, ApplicationEvent $applicationEvent)
    {
        if ($applicationEvent->application_id !== $application->application_id) {
            abort(404);
        }

        $validated = $request->validate([
            'no_of_booths' => ['required', 'integer', 'min:1', 'max:127'],
        ]);

        $order = Orders::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->first(['order_id', 'is_paid']);

        if ($order && $order->is_paid) {
            throw ValidationException::withMessages([
                'order' => ['Order is already paid and cannot be changed.'],
            ]);
        }

        $selectedCount = (int) ApplicationBooths::query()
            ->where('application_event_id', $applicationEvent->application_event_id)
            ->where('is_active', true)
            ->count();

        $newQty = (int) $validated['no_of_booths'];
        if ($selectedCount > $newQty) {
            throw ValidationException::withMessages([
                'no_of_booths' => ["Cannot reduce booth quantity below current selected booths ({$selectedCount})."],
            ]);
        }

        $oldQty = (int) ($applicationEvent->no_of_booths ?? 0);
        $applicationEvent->update([
            'no_of_booths' => $newQty,
        ]);

        $this->activityLogService->logActivity(
            applicationCode: $application->application_code,
            activityType: 'Booth Qty Updated',
            activityDescription: "Booth quantity updated: {$oldQty} -> {$newQty}",
            userId: $request->user()->user_id ?? '',
        );

        return redirect()->back();
    }

    public function updateDiscount(Request $request, Applications $application)
    {
        if (($application->application_status ?? null) !== 'approved') {
            throw ValidationException::withMessages([
                'discount_price' => ['Discount can only be updated for approved applications.'],
            ]);
        }

        $validated = $request->validate([
            'discount_price' => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($application, $validated, $request) {
            $order = Orders::query()
                ->where('application_id', $application->application_id)
                ->where('is_active', true)
                ->orderByDesc('created_at')
                ->first();

            if ($order && $order->is_paid) {
                throw ValidationException::withMessages([
                    'discount_price' => ['Cannot update discount for a paid order.'],
                ]);
            }

            $this->rebuildOrderForApplication($application, (float) $validated['discount_price']);
            $this->activityLogService->logActivity(
                applicationCode: $application->application_code,
                activityType: 'Discount Updated',
                activityDescription: 'Discount updated: RM' . $validated['discount_price'],
                userId: $request->user()->user_id ?? '',
            );
        });

        return redirect()->back();
    }

    public function generateInvoice(Applications $application)
    {
        $hasApprovedEvent = ApplicationEvent::query()
            ->where('application_id', $application->application_id)
            ->where('application_status', 'approved')
            ->exists();

        if (!$hasApprovedEvent) {
            throw ValidationException::withMessages([
                'application_status' => ['Only applications with approved events can generate invoice.'],
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

    public function sendPaymentReminder(Request $request, Applications $application)
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

        $orderDate = $order->created_at ? $order->created_at->toDateString() : '-';
        $amount = number_format((float) $order->total_price, 2, '.', ',');

        Mail::to([$vendor->vendor_email, 'test@bonbon.com.my'])->queue(
            (new ApplicationPaymentReminderEmail(
                applicationCode: $application->application_code,
                vendorName: $vendor->vendor_name ?: 'Vendor',
                orderNo: (string) $order->order_no,
                orderDate: $orderDate,
                amount: $amount,
            ))->delay(
                now()->addMinute()
            )
        );

        $this->activityLogService->logActivity(
            applicationCode: $application->application_code,
            activityType: 'Payment Reminder',
            activityDescription: 'Payment reminder sent to vendor',
            userId: $request->user()->user_id,
        );

        return redirect()->back();
    }

    public function confirmBooths(Request $request, Applications $application)
    {
        Log::info('confirm booth');
        Log::info($application);
        $applicationEvent = ApplicationEvent::query()
            ->where('application_id', $application->application_id)
            ->orderBy('created_at')
            ->first();

        if (!$applicationEvent) {
            abort(404);
        }

        return $this->confirmBoothsForEvent($request, $application, $applicationEvent);
    }

    public function confirmBoothsForEvent(Request $request, Applications $application, ApplicationEvent $applicationEvent)
    {
        if ($applicationEvent->application_id !== $application->application_id) {
            abort(404);
        }

        if (($applicationEvent->application_status ?? null) !== 'approved') {
            throw ValidationException::withMessages([
                'event_booth_ids' => ['Only approved application events can confirm booths.'],
            ]);
        }

        $validated = $request->validate([
            'event_booth_ids' => ['required', 'array', 'size:' . (int) $applicationEvent->no_of_booths],
            'event_booth_ids.*' => ['required', 'uuid'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $eventBoothIds = array_values(array_unique($validated['event_booth_ids']));
        if (count($eventBoothIds) !== (int) $applicationEvent->no_of_booths) {
            throw ValidationException::withMessages([
                'event_booth_ids' => ['Duplicate booths detected. Please select again.'],
            ]);
        }

        $discountPrice = (float) ($validated['discount_price'] ?? 0);

        DB::transaction(function () use ($application, $applicationEvent, $eventBoothIds, $discountPrice) {
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
                ->where('application_event_id', $applicationEvent->application_event_id)
                ->where('is_active', true)
                ->pluck('booth_id')
                ->filter()
                ->values();

            $selectedEventBooths = EventBooths::query()
                ->where('event_id', $applicationEvent->event_id)
                ->whereIn('event_booth_id', $eventBoothIds)
                ->where('is_active', true)
                ->get(['event_booth_id', 'booth_id', 'booth_price', 'occupied', 'occupied_by_application_event_id']);

            if ($selectedEventBooths->count() !== count($eventBoothIds)) {
                throw ValidationException::withMessages([
                    'event_booth_ids' => ['One or more selected booths are invalid for this event.'],
                ]);
            }

            foreach ($selectedEventBooths as $eventBooth) {
                if ($eventBooth->occupied && (string) $eventBooth->occupied_by_application_event_id !== (string) $applicationEvent->application_event_id) {
                    throw ValidationException::withMessages([
                        'event_booth_ids' => ['One or more selected booths are already occupied.'],
                    ]);
                }
            }

            if ($existingBoothIds->isNotEmpty()) {
                EventBooths::query()
                    ->where('event_id', $applicationEvent->event_id)
                    ->whereIn('booth_id', $existingBoothIds)
                    ->update([
                        'occupied' => false,
                        'occupied_by_application_event_id' => null,
                    ]);
            }

            ApplicationBooths::query()
                ->where('application_event_id', $applicationEvent->application_event_id)
                ->delete();

            foreach ($selectedEventBooths as $eventBooth) {
                ApplicationBooths::create([
                    'application_id' => $application->application_id,
                    'application_event_id' => $applicationEvent->application_event_id,
                    'booth_id' => $eventBooth->booth_id,
                    'is_active' => true,
                ]);
            }

            EventBooths::query()
                ->where('event_id', $applicationEvent->event_id)
                ->whereIn('event_booth_id', $eventBoothIds)
                ->update([
                    'occupied' => true,
                    'occupied_by_application_event_id' => $applicationEvent->application_event_id,
                ]);

            $this->rebuildOrderForApplication($application, $discountPrice);
        });

        return response()->json([
            'message' => 'Booths confirmed successfully.',
        ]);
    }

    public function releaseBooths(Applications $application)
    {
        $applicationEvent = ApplicationEvent::query()
            ->where('application_id', $application->application_id)
            ->orderBy('created_at')
            ->first();

        if (!$applicationEvent) {
            abort(404);
        }

        return $this->releaseBoothsForEvent($application, $applicationEvent);
    }

    public function releaseBoothsForEvent(Applications $application, ApplicationEvent $applicationEvent)
    {
        if ($applicationEvent->application_id !== $application->application_id) {
            abort(404);
        }

        DB::transaction(function () use ($application, $applicationEvent) {
            $existingBoothIds = ApplicationBooths::query()
                ->where('application_event_id', $applicationEvent->application_event_id)
                ->where('is_active', true)
                ->pluck('booth_id')
                ->filter()
                ->values();

            if ($existingBoothIds->isNotEmpty()) {
                EventBooths::query()
                    ->where('event_id', $applicationEvent->event_id)
                    ->whereIn('booth_id', $existingBoothIds)
                    ->where('occupied_by_application_event_id', $applicationEvent->application_event_id)
                    ->update([
                        'occupied' => false,
                        'occupied_by_application_event_id' => null,
                    ]);
            }

            ApplicationBooths::query()
                ->where('application_event_id', $applicationEvent->application_event_id)
                ->delete();

            $order = Orders::query()
                ->where('application_id', $application->application_id)
                ->where('is_active', true)
                ->orderByDesc('created_at')
                ->first();

            if ($order && $order->is_paid) {
                return;
            }

            $this->rebuildOrderForApplication($application, $order ? (float) $order->discount_price : 0.0);
        });

        return redirect()->back();
    }

    private function rebuildOrderForApplication(Applications $application, float $discountPrice): void
    {
        $order = Orders::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->first();

        if ($order && $order->is_paid) {
            throw ValidationException::withMessages([
                'order' => ['This application has a paid order and cannot be changed.'],
            ]);
        }

        $approvedEvents = ApplicationEvent::query()
            ->where('application_id', $application->application_id)
            ->where('application_status', 'approved')
            ->get([
                'application_event_id',
                'event_id',
                'no_of_booths',
            ]);

        $subtotal = 0.0;
        $itemsToCreate = [];

        $eventIds = $approvedEvents->pluck('event_id')->unique()->values()->all();
        $eventRowsById = Events::query()
            ->whereIn('event_id', $eventIds, 'and', false)
            ->get(['event_id', 'event_name', 'require_deposit'])
            ->keyBy('event_id');

        foreach ($approvedEvents as $applicationEvent) {
            $eventId = (string) $applicationEvent->event_id;
            $eventRow = $eventRowsById->get($eventId);
            $eventName = (string) ($eventRow?->event_name ?? 'Event');
            $requiresDeposit = (bool) ($eventRow?->require_deposit ?? false);

            $depositTotal = 0.0;
            if ($requiresDeposit) {
                $depositValue = (string) (EventDeposits::query()
                    ->leftJoin('deposits', 'event_deposits.deposit_id', '=', 'deposits.deposit_id')
                    ->where('event_deposits.event_id', $eventId)
                    ->where('event_deposits.event_deposit_status', 'active')
                    ->orderByDesc('event_deposits.created_at')
                    ->value('deposits.deposit_amount') ?? '0');
                $depositTotal = (float) $depositValue;
            }

            if ($depositTotal > 0) {
                $subtotal += $depositTotal;
                $itemsToCreate[] = [
                    'application_event_id' => $applicationEvent->application_event_id,
                    'event_id' => $eventId,
                    'booth_id' => null,
                    'event_booth_id' => null,
                    'item_type' => 'deposit',
                    'quantity' => 1,
                    'price' => (string) $depositTotal,
                    'item_description' => "Deposit - {$eventName}",
                    'is_active' => true,
                ];
            }

            $selectedBoothIds = ApplicationBooths::query()
                ->where('application_event_id', $applicationEvent->application_event_id)
                ->where('is_active', true)
                ->pluck('booth_id')
                ->filter()
                ->values();

            if ($selectedBoothIds->isEmpty()) {
                continue;
            }

            $selectedEventBooths = EventBooths::query()
                ->where('event_id', $eventId)
                ->whereIn('booth_id', $selectedBoothIds)
                ->where('is_active', true)
                ->get(['event_booth_id', 'booth_id', 'booth_price']);

            $boothDetails = Booths::query()
                ->leftJoin('booth_types', 'booths.booth_type_id', '=', 'booth_types.booth_type_id')
                ->whereIn('booths.booth_id', $selectedEventBooths->pluck('booth_id')->all())
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

                $price = (float) $eventBooth->booth_price;
                $subtotal += $price;

                $itemsToCreate[] = [
                    'application_event_id' => $applicationEvent->application_event_id,
                    'event_id' => $eventId,
                    'booth_id' => $eventBooth->booth_id,
                    'event_booth_id' => $eventBooth->event_booth_id,
                    'item_type' => 'booth',
                    'quantity' => 1,
                    'price' => (string) $eventBooth->booth_price,
                    'item_description' => "{$eventName} - {$boothTypeName} - {$boothName}",
                    'is_active' => true,
                ];
            }
        }

        if ($discountPrice < 0) {
            $discountPrice = 0;
        }

        if ($discountPrice > $subtotal) {
            throw ValidationException::withMessages([
                'discount_price' => ['Discount cannot exceed total amount.'],
            ]);
        }

        if ($subtotal <= 0) {
            if ($order && !$order->is_paid) {
                $order->update(['is_active' => false]);
                OrderItems::query()
                    ->where('order_id', $order->order_id)
                    ->update(['is_active' => false]);
                OrderCharges::query()
                    ->where('order_id', $order->order_id)
                    ->delete();

                Invoices::query()
                    ->where('order_id', $order->order_id)
                    ->update(['invoice_status' => 'canceled']);
            }
            return;
        }

        $baseForCharges = max(0.0, $subtotal - $discountPrice);
        $activeCharges = Charges::activeForDate();
        $chargeResult = Charges::calculateForBase($baseForCharges, $activeCharges);
        $chargesTotal = (float) ($chargeResult['total'] ?? 0);

        $total = $baseForCharges + $chargesTotal;

        if (!$order) {
            do {
                $orderNo = Str::upper(Str::random(10));
            } while (Orders::query()->where('order_no', $orderNo)->exists());

            $order = Orders::create([
                'order_no' => $orderNo,
                'application_id' => $application->application_id,
                'application_code' => $application->application_code,
                'sub_total' => (string) $subtotal,
                'total_price' => (string) $total,
                'discount_price' => (string) $discountPrice,
                'charges_total' => (string) $chargesTotal,
                'is_paid' => false,
                'is_active' => true,
            ]);
        } else {
            $order->update([
                'sub_total' => (string) $subtotal,
                'total_price' => (string) $total,
                'discount_price' => (string) $discountPrice,
                'charges_total' => (string) $chargesTotal,
            ]);

            OrderItems::query()
                ->where('order_id', $order->order_id)
                ->delete();
            OrderCharges::query()
                ->where('order_id', $order->order_id)
                ->delete();
        }

        foreach ($itemsToCreate as $item) {
            OrderItems::create([
                'order_id' => $order->order_id,
                'application_event_id' => $item['application_event_id'],
                'event_id' => $item['event_id'],
                'booth_id' => $item['booth_id'],
                'event_booth_id' => $item['event_booth_id'],
                'item_type' => $item['item_type'],
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'item_description' => $item['item_description'],
                'is_active' => true,
            ]);
        }

        foreach (($chargeResult['lines'] ?? []) as $line) {
            OrderCharges::create([
                'order_id' => $order->order_id,
                'charges_id' => $line['charges_id'] ?? null,
                'charges_name' => $line['charges_name'] ?? 'Charge',
                'charges_type' => $line['charges_type'] ?? 'F',
                'charges_rate' => (string) ($line['charges_rate'] ?? 0),
                'charges_amount' => (string) ($line['charges_amount'] ?? 0),
                'sort_order' => (int) ($line['sort_order'] ?? 1),
            ]);
        }

        $existingInvoice = Invoices::query()
            ->where('order_id', $order->order_id)
            ->orderByDesc('created_at')
            ->first(['invoice_id']);

        if ($existingInvoice) {
            $order->refresh();
            $this->invoiceService->upsertInvoiceForOrder($order, $application);
        }
    }

    public function update(Request $request, Applications $application)
    {
        $validated = $request->validate([
            'vendor_id' => ['nullable', 'uuid', 'exists:vendors,vendor_id'],
            'application_status' => ['nullable', 'in:pending,approved,rejected,cancelled'],
        ]);

        $updates = [];
        if (!empty($validated['vendor_id'])) {
            $updates['vendor_id'] = $validated['vendor_id'];
        }
        if (!empty($validated['application_status'])) {
            $updates['application_status'] = $validated['application_status'];
        }

        if (!empty($updates)) {
            $application->update($updates);
        }

        return redirect()->back();
    }

    public function destroy(Applications $application)
    {
        $application->update([
            'application_status' => 'cancelled',
        ]);

        ApplicationEvent::query()
            ->where('application_id', $application->application_id)
            ->update([
                'application_status' => 'cancelled',
            ]);

        return redirect()->back();
    }
}
