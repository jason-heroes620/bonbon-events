<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\ApplicationEvent;
use App\Models\Applications;
use App\Models\Invoices;
use App\Models\Orders;
use App\Models\Payments;
use App\Models\Vendors;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class VendorApplicationsController extends Controller
{
    public function index(Request $request): Response
    {
        $vendorId = $this->vendorIdOrFail($request);
        $search = $request->string('search')->toString();

        $latestOrderTimes = Orders::query()
            ->where('orders.is_active', true)
            ->select([
                'orders.application_id as application_id',
                DB::raw('MAX(orders.created_at) as max_created_at'),
            ])
            ->groupBy('orders.application_id');

        $applications = Applications::query()
            ->where('applications.vendor_id', $vendorId)
            ->leftJoinSub(
                $latestOrderTimes,
                'latest_orders',
                'applications.application_id',
                '=',
                'latest_orders.application_id',
            )
            ->leftJoin('orders', function ($join) {
                $join->on('orders.application_id', '=', 'applications.application_id', 'and', false)
                    ->on('orders.created_at', '=', 'latest_orders.max_created_at', 'and', false);
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('applications.application_code', 'like', "%{$search}%")
                        ->orWhere('applications.application_status', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('applications.created_at')
            ->paginate(10, [
                'applications.application_id',
                'applications.application_code',
                'applications.application_status',
                'applications.created_at',
                'orders.order_id as order_id',
                'orders.order_no as order_no',
                'orders.is_paid as is_paid',
                'orders.total_price as total_price',
            ])
            ->withQueryString();

        $applicationIds = $applications->getCollection()->pluck('application_id')->filter()->values()->all();
        $eventsByApplicationId = collect();

        if (!empty($applicationIds)) {
            $eventsByApplicationId = ApplicationEvent::query()
                ->leftJoin('events', 'application_events.event_id', '=', 'events.event_id')
                ->whereIn('application_events.application_id', $applicationIds)
                ->orderBy('events.event_start_date', 'asc')
                ->orderBy('events.event_name', 'asc')
                ->get([
                    'application_events.application_id',
                    'events.event_name',
                    'events.event_start_date',
                ])
                ->groupBy('application_id');
        }

        $applications->through(function ($row) use ($eventsByApplicationId) {
            $rows = $eventsByApplicationId->get($row->application_id) ?? collect();
            $firstEventName = (string) ($rows->first()->event_name ?? '');
            $eventCount = (int) $rows->count();

            return [
                'application_id' => $row->application_id,
                'application_code' => $row->application_code,
                'application_status' => $row->application_status,
                'created_at' => $row->created_at,
                'event_count' => $eventCount,
                'first_event_name' => $firstEventName !== '' ? $firstEventName : null,
                'order_id' => $row->order_id,
                'order_no' => $row->order_no,
                'is_paid' => $row->is_paid !== null ? (bool) $row->is_paid : null,
                'total_price' => $row->total_price,
            ];
        });

        return Inertia::render('vendor/applications/applications', [
            'applications' => $applications,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function show(Applications $application, Request $request): Response
    {
        $vendorId = $this->vendorIdOrFail($request);

        if ($application->vendor_id !== $vendorId) {
            abort(403);
        }

        $vendor = Vendors::query()
            ->where('vendor_id', $vendorId)
            ->first([
                'vendor_id',
                'vendor_name',
                'vendor_contact_person',
                'vendor_contact_no',
                'vendor_email',
                'business_name',
                'business_registration_no',
            ]);

        $applicationEvents = ApplicationEvent::query()
            ->leftJoin('events', 'application_events.event_id', '=', 'events.event_id')
            ->where('application_events.application_id', $application->application_id)
            ->orderBy('events.event_start_date', 'asc')
            ->orderBy('events.event_name', 'asc')
            ->get([
                'application_events.application_event_id',
                'application_events.event_id',
                'events.event_name',
                'events.event_date',
                'events.event_time',
                'events.venue',
                'application_events.participants',
                'application_events.no_of_booths',
                'application_events.requirements',
                'application_events.plug',
                'application_events.application_status',
            ]);

        $order = Orders::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->first([
                'order_id',
                'order_no',
                'application_code',
                'sub_total',
                'discount_price',
                'charges_total',
                'total_price',
                'is_paid',
                'created_at',
            ]);

        $invoice = null;
        $payment = null;
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

            if ($order->is_paid) {
                $payment = Payments::query()
                    ->where('order_id', $order->order_id)
                    ->orderByDesc('payment_date')
                    ->orderByDesc('created_at')
                    ->first([
                        'payment_id',
                        'transaction_id',
                        'payment_amount',
                        'payment_date',
                        'payment_method',
                        'payment_file',
                    ]);
            }
        }

        return Inertia::render('vendor/applications/[id]', [
            'application' => $application->only([
                'application_id',
                'application_code',
                'application_status',
                'created_at',
            ]),
            'vendor' => $vendor,
            'applicationEvents' => $applicationEvents,
            'order' => $order,
            'invoice' => $invoice,
            'payment' => $payment,
        ]);
    }

    private function vendorIdOrFail(Request $request): string
    {
        $user = $request->user();

        $vendorId = Vendors::query()
            ->where('user_id', $user?->user_id)
            ->value('vendor_id');

        if (!$vendorId) {
            abort(403);
        }

        return (string) $vendorId;
    }
}
