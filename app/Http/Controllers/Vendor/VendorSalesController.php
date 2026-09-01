<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\ApplicationEvent;
use App\Models\Applications;
use App\Models\SalesRanges;
use App\Models\VendorSales;
use App\Models\Vendors;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class VendorSalesController extends Controller
{
    public function index(Request $request): Response
    {
        $vendorId = $this->vendorIdOrFail($request);
        $search = $request->string('search')->toString();
        $eligibleCutoff = Carbon::today()->subMonth()->toDateString();

        $sales = VendorSales::query()
            ->join(
                'applications',
                'vendor_sales.application_id',
                '=',
                'applications.application_id',
            )
            ->leftJoin('events', 'vendor_sales.event_id', '=', 'events.event_id')
            ->where('vendor_sales.vendor_id', $vendorId)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('applications.application_code', 'like', "%{$search}%")
                        ->orWhere('events.event_name', 'like', "%{$search}%")
                        ->orWhere('vendor_sales.total_sales_amount', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('vendor_sales.created_at')
            ->paginate(10, [
                'vendor_sales.vendor_sales_id',
                'vendor_sales.application_id',
                'vendor_sales.event_id',
                'vendor_sales.total_sales_amount',
                'vendor_sales.created_at',
                'applications.application_code',
                'events.event_name',
                'events.event_end_date',
            ])
            ->withQueryString();

        $eligibleApplications = Applications::query()
            ->where('applications.vendor_id', $vendorId)
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('orders')
                    ->whereColumn('orders.application_id', 'applications.application_id')
                    ->where('orders.is_active', true)
                    ->where('orders.is_paid', true);
            })
            ->whereExists(function ($query) use ($eligibleCutoff) {
                $query->select(DB::raw(1))
                    ->from('application_events')
                    ->join('events', 'application_events.event_id', '=', 'events.event_id')
                    ->whereColumn('application_events.application_id', 'applications.application_id')
                    ->where('application_events.application_status', 'approved')
                    ->whereDate('events.event_end_date', '>=', $eligibleCutoff);
            })
            ->orderByDesc('applications.created_at')
            ->get([
                'applications.application_id',
                'applications.application_code',
            ]);

        $eventRowsByApplicationId = collect();
        $eligibleApplicationIds = $eligibleApplications
            ->pluck('application_id')
            ->filter()
            ->values()
            ->all();

        if (!empty($eligibleApplicationIds)) {
            $eventRowsByApplicationId = ApplicationEvent::query()
                ->join(
                    'events',
                    'application_events.event_id',
                    '=',
                    'events.event_id',
                    'inner',
                    false,
                )
                ->whereIn('application_events.application_id', $eligibleApplicationIds)
                ->where('application_events.application_status', 'approved')
                ->whereDate('events.event_end_date', '>=', $eligibleCutoff)
                ->orderBy('application_events.created_at')
                ->orderBy('events.event_start_date')
                ->get([
                    'application_events.application_id',
                    'application_events.event_id',
                    'events.event_name',
                    'events.event_end_date',
                ])
                ->groupBy('application_id');
        }

        $eventOptions = $eligibleApplications
            ->map(function ($application) use ($eventRowsByApplicationId) {
                $firstEvent = $eventRowsByApplicationId
                    ->get($application->application_id)
                    ?->first();

                if (!$firstEvent) {
                    return null;
                }

                return [
                    'application_id' => $application->application_id,
                    'event_id' => $firstEvent->event_id,
                    'event_name' => $firstEvent->event_name,
                    'application_code' => $application->application_code,
                    'label' => sprintf(
                        '%s • %s',
                        (string) $firstEvent->event_name,
                        (string) $application->application_code,
                    ),
                ];
            })
            ->filter()
            ->values();

        $salesRanges = SalesRanges::query()
            ->where('is_active', true)
            ->orderBy('sales_range')
            ->get(['id', 'sales_range'])
            ->map(fn($row) => [
                'id' => $row->id,
                'sales_range' => $row->sales_range,
            ])
            ->values();

        return Inertia::render('vendor/sales/sales', [
            'sales' => $sales,
            'eventOptions' => $eventOptions,
            'salesRanges' => $salesRanges,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $vendorId = $this->vendorIdOrFail($request);
        $eligibleCutoff = Carbon::today()->subMonth()->toDateString();

        $validated = $request->validate([
            'application_id' => ['required', 'uuid'],
            'total_sales_amount' => [
                'required',
                'string',
                Rule::exists('sales_ranges', 'sales_range')->where(
                    fn($query) => $query->where('is_active', true),
                ),
            ],
        ]);

        $application = Applications::query()
            ->where('applications.application_id', $validated['application_id'])
            ->where('applications.vendor_id', $vendorId)
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('orders')
                    ->whereColumn('orders.application_id', 'applications.application_id')
                    ->where('orders.is_active', true)
                    ->where('orders.is_paid', true);
            })
            ->first([
                'applications.application_id',
                'applications.application_code',
            ]);

        if (!$application) {
            throw ValidationException::withMessages([
                'application_id' => ['Selected event is not eligible for sales submission.'],
            ]);
        }

        $event = ApplicationEvent::query()
            ->join(
                'events',
                'application_events.event_id',
                '=',
                'events.event_id',
                'inner',
                false,
            )
            ->where('application_events.application_id', $application->application_id)
            ->where('application_events.application_status', 'approved')
            ->whereDate('events.event_end_date', '>=', $eligibleCutoff)
            ->orderBy('application_events.created_at')
            ->orderBy('events.event_start_date')
            ->first([
                'application_events.event_id',
            ]);

        if (!$event) {
            throw ValidationException::withMessages([
                'application_id' => ['Selected event is not eligible for sales submission.'],
            ]);
        }

        VendorSales::query()->create([
            'vendor_sales_id' => (string) Str::uuid(),
            'vendor_id' => $vendorId,
            'application_id' => $application->application_id,
            'event_id' => $event->event_id,
            'total_sales_amount' => $validated['total_sales_amount'],
        ]);

        return redirect()->route('vendor.sales.index');
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
