<?php

namespace App\Http\Controllers;

use App\Models\ApplicationEvent;
use App\Models\SalesRanges;
use App\Models\VendorSales;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SalesReportController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedEventId = $request->string('event_id')->toString();
        $sort = $request->string('sort', 'vendor_name')->toString();
        $direction = $request->string('direction', 'asc')->toString();

        if (!in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'asc';
        }

        if (!in_array($sort, ['vendor_name', 'total_sales_rm'], true)) {
            $sort = 'vendor_name';
        }

        $events = DB::table('events')
            ->orderBy('event_start_date')
            ->orderBy('event_name')
            ->get([
                'event_id',
                'event_name',
                'event_start_date',
            ])
            ->values();

        $ranges = SalesRanges::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->get(['id', 'sales_range'])
            ->values();

        $salesRanges = $ranges
            ->map(fn($range) => [
                'id' => $range->id,
                'sales_range' => $range->sales_range,
            ])
            ->values();

        $chartDistribution = $ranges->map(fn($range) => [
            'sales_range' => $range->sales_range,
            'vendors_count' => 0,
        ]);

        $paginatedRows = collect();
        $paidVendorsForEvent = collect();

        if ($selectedEventId !== '') {
            $paidBaseQuery = $this->buildPaidVendorsBaseQuery($selectedEventId);

            $baseRows = (clone $paidBaseQuery)
                ->distinct()
                ->get([
                    'application_events.application_event_id',
                    'applications.application_id',
                    'applications.application_code',
                    'applications.vendor_id',
                    'vendors.vendor_name',
                ])
                ->values();

            $paidVendorIds = $baseRows
                ->pluck('vendor_id')
                ->filter()
                ->unique()
                ->values()
                ->all();

            $latestSalesByVendor = collect();
            if (!empty($paidVendorIds)) {
                $latestSalesSubquery = DB::table('vendor_sales')
                    ->select([
                        'vendor_id',
                        'total_sales_amount',
                        'created_at',
                        DB::raw('ROW_NUMBER() OVER (PARTITION BY vendor_id ORDER BY created_at DESC, vendor_sales_id DESC) as rn'),
                    ])
                    ->where('event_id', $selectedEventId)
                    ->whereIn('vendor_id', $paidVendorIds);

                $latestSalesRows = DB::query()
                    ->fromSub($latestSalesSubquery, 'vs_ranked')
                    ->where('rn', '=', 1)
                    ->get([
                        'vendor_id',
                        'total_sales_amount',
                    ]);

                $latestSalesByVendor = $latestSalesRows->keyBy('vendor_id');
            }

            if (!empty($paidVendorIds)) {
                $rangeCounts = [];
                foreach ($ranges as $range) {
                    $rangeCounts[(string) $range->sales_range] = 0;
                }

                foreach ($paidVendorIds as $vendorId) {
                    $salesRow = $latestSalesByVendor->get((string) $vendorId);
                    $rangeValue = (string) ($salesRow->total_sales_amount ?? '');
                    if ($rangeValue !== '' && array_key_exists($rangeValue, $rangeCounts)) {
                        $rangeCounts[$rangeValue]++;
                    }
                }

                $chartDistribution = $ranges->map(function ($range) use ($rangeCounts) {
                    return [
                        'sales_range' => $range->sales_range,
                        'vendors_count' => $rangeCounts[(string) $range->sales_range] ?? 0,
                    ];
                });
            }

            $boothNumbersByApplicationEventId = $this->getBoothNumbersByApplicationEventId($selectedEventId);

            $paidVendorsForEvent = $baseRows
                ->map(function ($row) use ($boothNumbersByApplicationEventId) {
                    $boothNumbers = $boothNumbersByApplicationEventId
                        ->get((string) ($row->application_event_id ?? '')) ?? collect();
                    $boothLabel = $boothNumbers->implode(', ');

                    $labelParts = [];
                    $labelParts[] = (string) ($row->vendor_name ?? '');
                    $labelParts[] = (string) ($row->application_code ?? '');
                    if ($boothLabel !== '') {
                        $labelParts[] = sprintf('Booth: %s', $boothLabel);
                    }

                    return [
                        'application_event_id' => $row->application_event_id,
                        'application_id' => $row->application_id,
                        'application_code' => $row->application_code,
                        'vendor_id' => $row->vendor_id,
                        'vendor_name' => $row->vendor_name,
                        'booth_numbers' => $boothLabel === '' ? null : $boothLabel,
                        'label' => implode(' • ', array_filter($labelParts, static fn($part) => trim((string) $part) !== '')),
                    ];
                })
                ->sortBy('vendor_name', SORT_NATURAL | SORT_FLAG_CASE)
                ->values();

            $tableRows = $baseRows->map(function ($row) use (
                $latestSalesByVendor,
                $boothNumbersByApplicationEventId
            ) {
                $vendorId = (string) ($row->vendor_id ?? '');
                $salesRow = $vendorId !== '' ? $latestSalesByVendor->get($vendorId) : null;
                $totalSalesRange = $salesRow->total_sales_amount ?? null;
                if ($totalSalesRange !== null && trim((string) $totalSalesRange) === '') {
                    $totalSalesRange = null;
                }

                $boothNumbers = $boothNumbersByApplicationEventId
                    ->get((string) ($row->application_event_id ?? '')) ?? collect();

                return [
                    'application_event_id' => $row->application_event_id,
                    'application_id' => $row->application_id,
                    'application_code' => $row->application_code,
                    'vendor_id' => $row->vendor_id,
                    'vendor_name' => $row->vendor_name,
                    'total_sales_amount' => $totalSalesRange,
                    'booth_numbers' => $boothNumbers->implode(', ') ?: null,
                ];
            });

            $sortedRows = $tableRows->sort(function ($a, $b) use ($sort, $direction) {
                if ($sort === 'total_sales_rm') {
                    $aValue = (string) ($a['total_sales_amount'] ?? '');
                    $bValue = (string) ($b['total_sales_amount'] ?? '');
                    $cmp = strnatcasecmp($aValue, $bValue);
                    if ($cmp !== 0) {
                        return $direction === 'asc' ? $cmp : -$cmp;
                    }
                }

                $aVendor = (string) ($a['vendor_name'] ?? '');
                $bVendor = (string) ($b['vendor_name'] ?? '');
                $cmp = strcasecmp($aVendor, $bVendor);
                return $direction === 'asc' ? $cmp : -$cmp;
            })->values();

            $page = (int) $request->input('page', 1);
            $perPage = 10;
            $offset = ($page - 1) * $perPage;
            $total = $sortedRows->count();

            $paginatedCollection = $sortedRows->slice($offset, $perPage)->values();
            $path = $request->url();

            $paginatedRows = new \Illuminate\Pagination\LengthAwarePaginator(
                $paginatedCollection,
                $total,
                $perPage,
                $page,
                [
                    'path' => $path,
                    'query' => $request->query(),
                ]
            );

            $paginatedRows
                ->through(function ($row) {
                    $totalSalesRange = $row['total_sales_amount'] ?? null;

                    return [
                        'application_id' => $row['application_id'] ?? null,
                        'application_event_id' => $row['application_event_id'] ?? null,
                        'application_code' => $row['application_code'] ?? null,
                        'vendor_id' => $row['vendor_id'] ?? null,
                        'vendor_name' => $row['vendor_name'] ?? null,
                        'booth_numbers' => $row['booth_numbers'] ?? null,
                        'total_sales_rm' => $totalSalesRange,
                        'sales_range' => $totalSalesRange,
                    ];
                });
        }

        return Inertia::render('finance/sales-report', [
            'events' => $events,
            'selectedEventId' => $selectedEventId !== '' ? $selectedEventId : null,
            'filters' => [
                'sort' => $sort,
                'direction' => $direction,
            ],
            'chartDistribution' => $chartDistribution,
            'vendorRows' => $paginatedRows,
            'salesRanges' => $salesRanges,
            'paidVendorsForEvent' => $paidVendorsForEvent,
        ]);
    }

    public function storeManualSubmission(Request $request)
    {
        $validated = $request->validate([
            'application_event_id' => ['required', 'uuid'],
            'total_sales_amount' => [
                'required',
                'string',
                Rule::exists('sales_ranges', 'sales_range')->where(
                    static fn($query) => $query->where('is_active', true),
                ),
            ],
        ]);

        $eligibleRow = ApplicationEvent::query()
            ->letJoin('applications', 'application_events.application_id', '=', 'applications.application_id')
            ->join('vendors', 'applications.vendor_id', '=', 'vendors.vendor_id')
            ->join('orders', function ($join) {
                $join->on('orders.application_id', '=', 'applications.application_id')
                    ->where('orders.is_active', true)
                    ->where('orders.is_paid', true);
            })
            ->where('application_events.application_event_id', $validated['application_event_id'])
            ->where('application_events.application_status', 'approved')
            ->whereNotNull('applications.vendor_id')
            ->whereNotNull('vendors.vendor_id')
            ->first([
                'application_events.application_event_id',
                'application_events.application_id',
                'application_events.event_id',
                'applications.vendor_id',
            ]);

        if (!$eligibleRow) {
            throw ValidationException::withMessages([
                'application_event_id' => [
                    'Selected vendor is not a paid, approved vendor for this event.',
                ],
            ]);
        }

        VendorSales::query()->create([
            'vendor_sales_id' => (string) Str::uuid(),
            'vendor_id' => $eligibleRow->vendor_id,
            'application_id' => $eligibleRow->application_id,
            'event_id' => $eligibleRow->event_id,
            'total_sales_amount' => $validated['total_sales_amount'],
        ]);

        return redirect()->route('sales-report.index', [
            'event_id' => $eligibleRow->event_id,
            'sort' => $request->input('sort', 'vendor_name'),
            'direction' => $request->input('direction', 'asc'),
        ]);
    }

    private function buildPaidVendorsBaseQuery(string $eventId)
    {
        return ApplicationEvent::query()
            ->leftJoin('applications', 'application_events.application_id', '=', 'applications.application_id')
            ->leftJoin('vendors', 'applications.vendor_id', '=', 'vendors.vendor_id')
            ->join('orders', function ($join) {
                $join->on('orders.application_id', '=', 'applications.application_id')
                    ->where('orders.is_active', true)
                    ->where('orders.is_paid', true);
            })
            ->where('application_events.event_id', $eventId)
            ->where('application_events.application_status', 'approved')
            ->whereNotNull('applications.vendor_id')
            ->whereNotNull('vendors.vendor_id');
    }

    private function getBoothNumbersByApplicationEventId(string $eventId)
    {
        $rows = DB::table('event_booths')
            ->join(
                'application_events',
                'application_events.application_event_id',
                '=',
                'event_booths.occupied_by_application_event_id'
            )
            ->join('booths', 'event_booths.booth_id', '=', 'booths.booth_id')
            ->where('event_booths.event_id', $eventId)
            ->where('event_booths.is_active', true)
            ->where('event_booths.occupied', true)
            ->whereNotNull('event_booths.occupied_by_application_event_id')
            ->where('application_events.application_status', 'approved')
            ->orderBy('booths.booth_name')
            ->get([
                'event_booths.occupied_by_application_event_id as application_event_id',
                'booths.booth_name',
            ]);

        return $rows
            ->groupBy('application_event_id')
            ->map(fn($group) => $group
                ->pluck('booth_name')
                ->filter(fn($name) => $name !== null && trim((string) $name) !== '')
                ->unique()
                ->values());
    }
}
