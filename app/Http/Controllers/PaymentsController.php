<?php

namespace App\Http\Controllers;

use App\Mail\InvoiceRequestedEmail;
use App\Jobs\EnsurePaidInvoiceGenerated;
use App\Models\ApplicationBooths;
use App\Models\ApplicationEvent;
use App\Models\Applications;
use App\Models\Booths;
use App\Models\EventBooths;
use App\Models\EventDeposits;
use App\Models\Events;
use App\Models\Invoices;
use App\Models\OrderItems;
use App\Models\Orders;
use App\Models\Payments;
use App\Models\Vendors;
use App\Services\InvoiceService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PaymentsController extends Controller
{
    public function __construct(private InvoiceService $invoiceService) {}

    private function ipay88Endpoint(): string
    {
        return (string) (config('services.ipay88.endpoint')
            ?? env('IPAY88_ENDPOINT')
            ?? 'https://sandbox.ipay88.co.id/ePayment/entry.asp');
    }

    private function ipay88MerchantCode(): string
    {
        return (string) (config('services.ipay88.merchant_code')
            ?? env('IPAY88_MERCHANT_CODE')
            ?? '');
    }

    private function ipay88MerchantKey(): string
    {
        return (string) (config('services.ipay88.merchant_key')
            ?? env('IPAY88_MERCHANT_KEY')
            ?? '');
    }

    private function ipay88Currency(): string
    {
        return (string) (config('services.ipay88.currency')
            ?? env('IPAY88_CURRENCY')
            ?? 'MYR');
    }

    private function ipay88Lang(): string
    {
        return (string) (config('services.ipay88.lang')
            ?? env('IPAY88_LANG')
            ?? 'UTF-8');
    }

    private function ipay88Signature(string $refNo, string $amount, string $currency): string
    {
        $merchantKey = $this->ipay88MerchantKey();
        $merchantCode = $this->ipay88MerchantCode();

        if ($merchantKey === '' || $merchantCode === '') {
            return '';
        }

        $raw = $merchantKey . $merchantCode . $refNo . str_replace([".", ','], '', $amount) . $currency . 'Events';
        Log::info('IPAY88 Raw Signature: ' . $raw);
        return hash_hmac('sha512', $raw, $merchantKey);
    }

    public function show(Request $request, string $applicationCode): Response
    {
        $application = Applications::query()
            ->where('application_code', $applicationCode)
            ->first();

        if (!$application) {
            abort(404);
        }

        $order = Orders::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->first([
                'order_id',
                'order_no',
                'application_id',
                'application_code',
                'total_price',
                'discount_price',
                'is_paid',
                'created_at',
            ]);

        $invoice = null;
        if ($order) {
            $invoice = Invoices::query()
                ->where('order_id', $order->order_id)
                ->orderByDesc('created_at')
                ->first([
                    'invoice_id',
                    'invoice_no',
                    'invoice_status',
                    'invoice_amount',
                    'invoice_date',
                ]);
        }

        $items = [];
        if ($order) {
            $items = OrderItems::query()
                ->where('order_id', $order->order_id)
                ->orderBy('created_at')
                ->get([
                    'order_item_id',
                    'quantity',
                    'price',
                    'item_description',
                ]);
        }

        $applicationEvents = ApplicationEvent::query()
            ->leftJoin('events', 'application_events.event_id', '=', 'events.event_id')
            ->where('application_events.application_id', $application->application_id)
            ->where('application_events.application_status', 'approved')
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
                'events.event_name',
                'events.event_start_date',
                'events.require_deposit',
            ]);

        $depositAmountsByEventId = EventDeposits::query()
            ->leftJoin('deposits', 'event_deposits.deposit_id', '=', 'deposits.deposit_id')
            ->whereIn('event_deposits.event_id', $applicationEvents->pluck('event_id')->unique()->values()->all())
            ->where('event_deposits.event_deposit_status', 'active')
            ->orderByDesc('event_deposits.created_at')
            ->get(['event_deposits.event_id', 'deposits.deposit_amount'])
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
            ->orderBy('booths.booth_name')
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
                'event_booths' => $eventBooths->values(),
                'selected_event_booth_ids' => $selectedEventBoothIds,
            ];
        });

        return Inertia::render('payments/[application_code]', [
            'application' => $application->only([
                'application_id',
                'application_code',
                'application_status',
            ]),
            'order' => $order,
            'invoice' => $invoice,
            'items' => $items,
            'applicationEvents' => $applicationEventsView,
            'ipay88' => [
                'enabled' => $this->ipay88MerchantCode() !== '' && $this->ipay88MerchantKey() !== '',
            ],
        ]);
    }

    public function prepare(Request $request, string $applicationCode)
    {
        $application = Applications::query()
            ->where('application_code', $applicationCode)
            ->first();

        if (!$application) {
            abort(404);
        }

        if (($application->application_status ?? null) !== 'approved') {
            throw ValidationException::withMessages([
                'application' => ['Application is not approved.'],
            ]);
        }

        $validated = $request->validate([
            'selections' => ['required', 'array', 'min:1'],
            'selections.*.application_event_id' => ['required', 'uuid'],
            'selections.*.event_booth_ids' => ['required', 'array'],
            'selections.*.event_booth_ids.*' => ['required', 'uuid'],
        ]);

        DB::transaction(function () use ($application, $validated) {
            $order = Orders::query()
                ->where('application_id', $application->application_id)
                ->where('is_active', true)
                ->orderByDesc('created_at')
                ->first();

            if ($order && $order->is_paid) {
                throw ValidationException::withMessages([
                    'order' => ['Order is already paid.'],
                ]);
            }

            $discountPrice = $order ? (float) $order->discount_price : 0.0;

            $applicationEventIds = collect($validated['selections'])
                ->pluck('application_event_id')
                ->unique()
                ->values()
                ->all();

            $allApprovedEventIds = ApplicationEvent::query()
                ->where('application_id', $application->application_id)
                ->where('application_status', 'approved')
                ->pluck('application_event_id')
                ->unique()
                ->values()
                ->all();

            sort($applicationEventIds);
            sort($allApprovedEventIds);

            if ($applicationEventIds !== $allApprovedEventIds) {
                throw ValidationException::withMessages([
                    'selections' => ['Please select booths for all events before proceeding.'],
                ]);
            }

            $applicationEvents = ApplicationEvent::query()
                ->where('application_id', $application->application_id)
                ->whereIn('application_event_id', $applicationEventIds, 'and', false)
                ->where('application_status', 'approved')
                ->get(['application_event_id', 'event_id', 'no_of_booths'])
                ->keyBy('application_event_id');

            if ($applicationEvents->count() !== count($applicationEventIds)) {
                throw ValidationException::withMessages([
                    'selections' => ['Invalid application event selection.'],
                ]);
            }

            foreach ($validated['selections'] as $selection) {
                $applicationEvent = $applicationEvents->get($selection['application_event_id']);
                if (!$applicationEvent) {
                    throw ValidationException::withMessages([
                        'selections' => ['Invalid application event selection.'],
                    ]);
                }

                $eventBoothIds = array_values(array_unique($selection['event_booth_ids'] ?? []));
                if (count($eventBoothIds) !== (int) $applicationEvent->no_of_booths) {
                    throw ValidationException::withMessages([
                        'selections' => ['Please select the required number of booths for each event.'],
                    ]);
                }

                $eventBooths = EventBooths::query()
                    ->where('event_id', $applicationEvent->event_id)
                    ->whereIn('event_booth_id', $eventBoothIds, 'and', false)
                    ->where('is_active', true)
                    ->get(['event_booth_id', 'booth_id', 'occupied', 'occupied_by_application_event_id']);

                if ($eventBooths->count() !== count($eventBoothIds)) {
                    throw ValidationException::withMessages([
                        'selections' => ['Invalid booth selection.'],
                    ]);
                }

                $invalidOccupied = $eventBooths->first(function ($row) use ($applicationEvent) {
                    return (bool) $row->occupied
                        && $row->occupied_by_application_event_id
                        && $row->occupied_by_application_event_id !== $applicationEvent->application_event_id;
                });

                if ($invalidOccupied) {
                    throw ValidationException::withMessages([
                        'selections' => ['One or more selected booths are no longer available.'],
                    ]);
                }

                EventBooths::query()
                    ->where('occupied_by_application_event_id', $applicationEvent->application_event_id)
                    ->whereNotIn('event_booth_id', $eventBoothIds, 'and', false)
                    ->update([
                        'occupied' => false,
                        'occupied_by_application_event_id' => null,
                    ]);

                EventBooths::query()
                    ->where('event_id', $applicationEvent->event_id)
                    ->whereIn('event_booth_id', $eventBoothIds, 'and', false)
                    ->update([
                        'occupied' => true,
                        'occupied_by_application_event_id' => $applicationEvent->application_event_id,
                    ]);

                ApplicationBooths::query()
                    ->where('application_event_id', $applicationEvent->application_event_id)
                    ->delete();

                foreach ($eventBooths as $row) {
                    ApplicationBooths::create([
                        'application_event_id' => $applicationEvent->application_event_id,
                        'application_id' => $application->application_id,
                        'booth_id' => $row->booth_id,
                        'is_active' => true,
                    ]);
                }
            }

            $this->rebuildOrderForApplication($application, $discountPrice);

            $updatedOrder = Orders::query()
                ->where('application_id', $application->application_id)
                ->where('is_active', true)
                ->orderByDesc('created_at')
                ->first();

            if (!$updatedOrder) {
                throw ValidationException::withMessages([
                    'order' => ['Order not found.'],
                ]);
            }

            $this->invoiceService->upsertInvoiceForOrder($updatedOrder, $application);
        });

        return Inertia::location('/payments/' . $application->application_code . '/ipay88');
    }

    public function requestInvoice(Request $request, string $applicationCode)
    {
        $application = Applications::query()
            ->where('application_code', $applicationCode)
            ->first();

        if (!$application) {
            abort(404);
        }

        if (($application->application_status ?? null) !== 'approved') {
            throw ValidationException::withMessages([
                'application' => ['Application is not approved.'],
            ]);
        }

        $validated = $request->validate([
            'selections' => ['required', 'array', 'min:1'],
            'selections.*.application_event_id' => ['required', 'uuid'],
            'selections.*.event_booth_ids' => ['required', 'array'],
            'selections.*.event_booth_ids.*' => ['required', 'uuid'],
        ]);

        $invoice = null;

        DB::transaction(function () use ($application, $validated, &$invoice) {
            $order = Orders::query()
                ->where('application_id', $application->application_id)
                ->where('is_active', true)
                ->orderByDesc('created_at')
                ->first();

            if ($order && $order->is_paid) {
                throw ValidationException::withMessages([
                    'order' => ['Order is already paid.'],
                ]);
            }

            $discountPrice = $order ? (float) $order->discount_price : 0.0;

            $applicationEventIds = collect($validated['selections'])
                ->pluck('application_event_id')
                ->unique()
                ->values()
                ->all();

            $allApprovedEventIds = ApplicationEvent::query()
                ->where('application_id', $application->application_id)
                ->where('application_status', 'approved')
                ->pluck('application_event_id')
                ->unique()
                ->values()
                ->all();

            sort($applicationEventIds);
            sort($allApprovedEventIds);

            if ($applicationEventIds !== $allApprovedEventIds) {
                throw ValidationException::withMessages([
                    'selections' => ['Please select booths for all events before proceeding.'],
                ]);
            }

            $applicationEvents = ApplicationEvent::query()
                ->where('application_id', $application->application_id)
                ->whereIn('application_event_id', $applicationEventIds, 'and', false)
                ->where('application_status', 'approved')
                ->get(['application_event_id', 'event_id', 'no_of_booths'])
                ->keyBy('application_event_id');

            if ($applicationEvents->count() !== count($applicationEventIds)) {
                throw ValidationException::withMessages([
                    'selections' => ['Invalid application event selection.'],
                ]);
            }

            foreach ($validated['selections'] as $selection) {
                $applicationEvent = $applicationEvents->get($selection['application_event_id']);
                if (!$applicationEvent) {
                    throw ValidationException::withMessages([
                        'selections' => ['Invalid application event selection.'],
                    ]);
                }

                $eventBoothIds = array_values(array_unique($selection['event_booth_ids'] ?? []));
                if (count($eventBoothIds) !== (int) $applicationEvent->no_of_booths) {
                    throw ValidationException::withMessages([
                        'selections' => ['Please select the required number of booths for each event.'],
                    ]);
                }

                $eventBooths = EventBooths::query()
                    ->where('event_id', $applicationEvent->event_id)
                    ->whereIn('event_booth_id', $eventBoothIds, 'and', false)
                    ->where('is_active', true)
                    ->get(['event_booth_id', 'booth_id', 'occupied', 'occupied_by_application_event_id']);

                if ($eventBooths->count() !== count($eventBoothIds)) {
                    throw ValidationException::withMessages([
                        'selections' => ['Invalid booth selection.'],
                    ]);
                }

                $invalidOccupied = $eventBooths->first(function ($row) use ($applicationEvent) {
                    return (bool) $row->occupied
                        && $row->occupied_by_application_event_id
                        && $row->occupied_by_application_event_id !== $applicationEvent->application_event_id;
                });

                if ($invalidOccupied) {
                    throw ValidationException::withMessages([
                        'selections' => ['One or more selected booths are no longer available.'],
                    ]);
                }

                EventBooths::query()
                    ->where('occupied_by_application_event_id', $applicationEvent->application_event_id)
                    ->whereNotIn('event_booth_id', $eventBoothIds, 'and', false)
                    ->update([
                        'occupied' => false,
                        'occupied_by_application_event_id' => null,
                    ]);

                EventBooths::query()
                    ->where('event_id', $applicationEvent->event_id)
                    ->whereIn('event_booth_id', $eventBoothIds, 'and', false)
                    ->update([
                        'occupied' => true,
                        'occupied_by_application_event_id' => $applicationEvent->application_event_id,
                    ]);

                ApplicationBooths::query()
                    ->where('application_event_id', $applicationEvent->application_event_id)
                    ->delete();

                foreach ($eventBooths as $row) {
                    ApplicationBooths::create([
                        'application_event_id' => $applicationEvent->application_event_id,
                        'application_id' => $application->application_id,
                        'booth_id' => $row->booth_id,
                        'is_active' => true,
                    ]);
                }
            }

            $this->rebuildOrderForApplication($application, $discountPrice);

            $updatedOrder = Orders::query()
                ->where('application_id', $application->application_id)
                ->where('is_active', true)
                ->orderByDesc('created_at')
                ->first();

            if (!$updatedOrder) {
                throw ValidationException::withMessages([
                    'order' => ['Order not found.'],
                ]);
            }

            $invoice = $this->invoiceService->upsertInvoiceForOrder($updatedOrder, $application);
        });

        if (!$invoice) {
            throw ValidationException::withMessages([
                'invoice' => ['Invoice not found.'],
            ]);
        }

        $order = Orders::query()
            ->with(['application.vendor', 'application.events.event'])
            ->where('order_id', $invoice->order_id)
            ->first();

        if (!$order) {
            throw ValidationException::withMessages([
                'order' => ['Order not found.'],
            ]);
        }

        $items = OrderItems::query()
            ->where('order_id', $order->order_id)
            ->where('is_active', true)
            ->orderBy('created_at')
            ->get(['order_item_id', 'quantity', 'price', 'item_description']);

        $subtotal = (float) $items->sum(fn($item) => (float) $item->price * (int) $item->quantity);
        $discount = (float) ($invoice->discount_amount ?? $order->discount_price ?? 0);
        $total = (float) ($invoice->invoice_amount ?? $order->total_price ?? max(0, $subtotal - $discount));

        $applicationModel = $order->application;
        $vendorModel = $applicationModel?->vendor;
        $eventName = $applicationModel?->events
            ?->map(fn($ae) => $ae->event?->event_name)
            ->filter()
            ->values()
            ->join(', ');

        $pdf = Pdf::loadView('invoices.template', [
            'order' => $order,
            'invoice' => $invoice,
            'application' => $applicationModel,
            'vendor' => $vendorModel,
            'items' => $items,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
            'eventName' => $eventName,
            'companyName' => (string) config('app.name', 'BonBon'),
        ]);

        $vendorEmail = (string) ($vendorModel?->vendor_email ?? '');
        if ($vendorEmail === '') {
            throw ValidationException::withMessages([
                'vendor' => ['Vendor email not found.'],
            ]);
        }

        $invoiceNo = (string) ($invoice->invoice_no ?? 'Invoice');
        $fileName = 'invoice_' . $invoiceNo . '.pdf';
        $amountText = number_format((float) $total, 2, '.', ',');

        Mail::to($vendorEmail)->send(
            new InvoiceRequestedEmail(
                vendorName: (string) ($vendorModel?->vendor_name ?? 'Vendor'),
                applicationCode: (string) $application->application_code,
                invoiceNo: $invoiceNo,
                amount: $amountText,
                pdfData: $pdf->output(),
                fileName: $fileName,
            ),
        );

        return redirect()
            ->back()
            ->with('success', 'Invoice has been sent to your email.');
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
            ->get(['application_event_id', 'event_id', 'no_of_booths']);

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
                ->get(['booths.booth_id', 'booths.booth_name', 'booth_types.booth_type_name'])
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

                Invoices::query()
                    ->where('order_id', $order->order_id)
                    ->update(['invoice_status' => 'canceled']);
            }
            return;
        }

        $total = $subtotal - $discountPrice;

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
    }

    public function redirectToIpay88(string $applicationCode)
    {
        $application = Applications::query()
            ->where('application_code', $applicationCode)
            ->first();

        if (!$application) {
            abort(404);
        }

        $order = Orders::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->first();

        if (!$order) {
            throw ValidationException::withMessages([
                'order' => ['Order not found.'],
            ]);
        }

        if ($order->is_paid) {
            return redirect()->to('/payments/' . $application->application_code);
        }

        $merchantCode = $this->ipay88MerchantCode();
        $merchantKey = $this->ipay88MerchantKey();
        if ($merchantCode === '' || $merchantKey === '') {
            throw ValidationException::withMessages([
                'ipay88' => ['iPay88 is not configured.'],
            ]);
        }

        $currency = $this->ipay88Currency();

        $amount = number_format((float) $order->total_price, 2, '.', '');
        $refNo = $order->order_no;

        $responseUrl = rtrim((string) config('services.ipay88.host_url'), '/') . '/api/payments/frontend-callback';
        $backendUrl = rtrim((string) config('services.ipay88.host_url'), '/') . '/api/payments/backend-callback';

        $signature = $this->ipay88Signature($refNo, $amount, $currency);
        if ($signature === '') {
            throw ValidationException::withMessages([
                'ipay88' => ['Unable to generate signature.'],
            ]);
        }

        $vendor = Vendors::query()
            ->where('vendor_id', $application->vendor_id)
            ->first(['vendor_name', 'vendor_email', 'vendor_contact_no']);

        $prodDesc = 'BonBon Event Payment ' . $application->application_code;
        $userName = $vendor?->vendor_name ?: 'Customer';
        $userEmail = $vendor?->vendor_email ?: 'customer@example.com';
        $userContact = $vendor?->vendor_contact_no ?: '0000000000';

        $fields = [
            'MerchantCode' => $merchantCode,
            'RefNo' => $refNo,
            'Amount' => $amount,
            'Currency' => $currency,
            'ProdDesc' => $prodDesc,
            'UserName' => $userName,
            'UserEmail' => $userEmail,
            'UserContact' => $userContact,
            'Remark' => $application->application_code,
            'Signature' => $signature,
            'Xfield1' => 'Events',
            'ResponseURL' => $responseUrl,
            'BackendURL' => $backendUrl,
        ];

        $endpoint = $this->ipay88Endpoint();

        $inputs = '';
        foreach ($fields as $key => $value) {
            $k = e((string) $key);
            $v = e((string) $value);
            $inputs .= "<input type=\"hidden\" name=\"{$k}\" value=\"{$v}\">";
        }

        $html = "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Redirecting...</title></head><body>"
            . "<form id=\"ipay88\" method=\"POST\" action=\"" . e($endpoint) . "\">{$inputs}</form>"
            . "<script>document.getElementById('ipay88').submit();</script>"
            . "</body></html>";

        return response($html);
    }

    public function backend(Request $request)
    {
        $merchantCode = $request->string('MerchantCode')->toString();
        $refNo = $request->string('RefNo')->toString();
        $amount = $request->string('Amount')->toString();
        $currency = $request->string('Currency')->toString();
        $status = $request->string('Status')->toString();
        $signature = $request->string('Signature')->toString();
        $paymentDate = $request->string('TranDate');
        $issuing_bank = $request->string('S_bankname')->toString();
        $cc_name = $request->string('CCName')->toString();
        $cc_number = $request->string('CCNo')->toString();

        if ($merchantCode === '' || $refNo === '') {
            return response('INVALID', 400);
        }

        if ($merchantCode !== $this->ipay88MerchantCode()) {
            return response('INVALID', 400);
        }

        $expectedSignature = $this->ipay88Signature($refNo, $amount, $currency);
        $signatureOk = $expectedSignature !== '' && hash_equals($expectedSignature, $signature);
        if (!$signatureOk) {
            return response('INVALID', 400);
        }

        $order = Orders::query()
            ->where('order_no', $refNo)
            ->where('is_active', true)
            ->first();

        if (!$order) {
            return response('INVALID', 404);
        }

        $application = Applications::query()
            ->where('application_id', $order->application_id)
            ->first();

        if (!$application) {
            return response('INVALID', 404);
        }

        if ($status !== '1') {
            Payments::create([
                'order_id' => $order->order_id,
                'order_no' => $order->order_no,
                'payment_amount' => (float) $amount,
                'payment_date' => $paymentDate,
                'payment_status' => false,
            ]);

            return response('RECEIVEOK', 200);
        }

        DB::transaction(function () use ($order, $amount, $paymentDate, $issuing_bank, $cc_name, $cc_number) {
            if (!$order->is_paid) {
                $order->update(['is_paid' => true]);
            }

            Payments::create([
                'order_id' => $order->order_id,
                'order_no' => $order->order_no,
                'payment_amount' => (float) $amount,
                'payment_date' => $paymentDate,
                'payment_status' => true,
                'issuing_bank' => $issuing_bank,
                'cc_name' => $cc_name,
                'cc_number' => $cc_number,
            ]);
        });

        EnsurePaidInvoiceGenerated::dispatch(
            orderId: $order->order_id,
            applicationId: $application->application_id,
        )->afterResponse();

        return response('RECEIVEOK', 200);
    }

    public function response(Request $request)
    {
        $refNo = $request->string('RefNo')->toString();

        $order = Orders::query()
            ->where('order_no', $refNo)
            ->first();

        if (!$order) {
            return redirect('/');
        }

        $application = Applications::query()
            ->where('application_id', $order->application_id)
            ->first();

        if (!$application) {
            return redirect('/');
        }

        return redirect()->to('/payments/' . $application->application_code);
    }
}
