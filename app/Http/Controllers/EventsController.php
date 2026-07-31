<?php

namespace App\Http\Controllers;

use App\Models\Deposits;
use App\Models\EventDeposits;
use App\Models\EventBooths;
use App\Models\EventLayoutImage;
use App\Models\BoothTypes;
use App\Models\Booths;
use App\Models\Events;
use App\Models\Locations;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EventsController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $events = Events::query()
            ->with(['location'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('event_name', 'like', "%{$search}%")
                        ->orWhere('venue', 'like', "%{$search}%")
                        ->orWhereHas('location', function ($query) use ($search) {
                            $query->where('location_name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByDesc('event_start_date')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('events/events', [
            'events' => $events,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function summary(Request $request): Response
    {
        $selectedEventId = $request->string('event_id')->toString();

        $events = Events::query()
            ->with(['layoutImages'])
            ->orderByDesc('event_start_date')
            ->get(['event_id', 'event_name', 'event_start_date'])
            ->map(function (Events $event) {
                $layoutImages = $this->serializeLayoutImages($event->layoutImages);

                return [
                    'event_id' => $event->event_id,
                    'event_name' => $event->event_name,
                    'event_start_date' => $event->event_start_date,
                    'primary_layout_image' => $layoutImages[0]['image_path'] ?? null,
                    'event_layout_images' => $layoutImages,
                ];
            })
            ->values();
        $groups = [];
        if ($selectedEventId !== '') {
            $latestOrders = DB::table('orders')
                ->where('orders.is_active', true)
                ->select([
                    'orders.application_id as application_id',
                    DB::raw('MAX(orders.created_at) as max_created_at'),
                ])
                ->groupBy('orders.application_id');

            $occupants = DB::table('event_booths')
                ->join('application_events', 'application_events.application_event_id', '=', 'event_booths.occupied_by_application_event_id')
                ->join('applications', 'applications.application_id', '=', 'application_events.application_id')
                ->join('vendors', 'vendors.vendor_id', '=', 'applications.vendor_id')
                ->leftJoinSub($latestOrders, 'latest_orders', function ($join) {
                    $join->on('latest_orders.application_id', '=', 'applications.application_id');
                })
                ->leftJoin('orders', function ($join) {
                    $join->on('orders.application_id', '=', 'applications.application_id')
                        ->on('orders.created_at', '=', 'latest_orders.max_created_at');
                })
                ->where('event_booths.event_id', $selectedEventId)
                ->where('event_booths.is_active', true)
                ->where('event_booths.occupied', true)
                ->whereNotNull('event_booths.occupied_by_application_event_id')
                ->where('application_events.application_status', 'approved')
                ->select([
                    'event_booths.booth_id as booth_id',
                    DB::raw('MAX(vendors.vendor_name) as vendor_name'),
                    DB::raw('MAX(applications.application_id) as application_id'),
                    DB::raw('MAX(CASE WHEN orders.is_paid = 1 THEN 1 ELSE 0 END) as is_paid'),
                ])
                ->groupBy('event_booths.booth_id');

            $rows = EventBooths::query()
                ->where('event_booths.event_id', $selectedEventId)
                ->where('event_booths.is_active', true)
                ->join('booths', 'event_booths.booth_id', '=', 'booths.booth_id')
                ->join('booth_types', 'booths.booth_type_id', '=', 'booth_types.booth_type_id')
                ->leftJoinSub($occupants, 'occupants', function ($join) {
                    $join->on('occupants.booth_id', '=', 'booths.booth_id');
                })
                ->orderBy('booth_types.booth_type_name', 'asc')
                ->orderBy('booths.booth_name', 'asc')
                ->get([
                    'booth_types.booth_type_id as booth_type_id',
                    'booth_types.booth_type_name as booth_type_name',
                    'booths.booth_id as booth_id',
                    'booths.booth_name as booth_name',
                    'event_booths.occupied as occupied',
                    DB::raw('occupants.vendor_name as vendor_name'),
                    DB::raw('occupants.application_id as application_id'),
                    DB::raw('occupants.is_paid as is_paid'),
                ]);

            $groups = $rows
                ->groupBy('booth_type_id')
                ->map(function ($items) {
                    $first = $items->first();
                    return [
                        'booth_type_id' => $first->booth_type_id,
                        'booth_type_name' => $first->booth_type_name,
                        'booths' => $items->map(function ($row) {
                            return [
                                'booth_id' => $row->booth_id,
                                'booth_name' => $row->booth_name,
                                'occupied' => (bool) $row->occupied,
                                'vendor_name' => $row->vendor_name,
                                'application_id' => $row->application_id,
                                'is_paid' => $row->is_paid !== null ? (bool) $row->is_paid : null,
                            ];
                        })->values(),
                    ];
                })
                ->values();
        }

        return Inertia::render('events/summary', [
            'events' => $events,
            'selectedEventId' => $selectedEventId !== '' ? $selectedEventId : null,
            'groups' => $groups,
        ]);
    }

    public function layoutOverview(Events $event): Response
    {
        $event->load(['layoutImages']);

        $latestOrders = DB::table('orders')
            ->where('orders.is_active', true)
            ->select([
                'orders.application_id as application_id',
                DB::raw('MAX(orders.created_at) as max_created_at'),
            ])
            ->groupBy('orders.application_id');

        $occupants = DB::table('event_booths')
            ->join('application_events', 'application_events.application_event_id', '=', 'event_booths.occupied_by_application_event_id')
            ->join('applications', 'applications.application_id', '=', 'application_events.application_id')
            ->join('vendors', 'vendors.vendor_id', '=', 'applications.vendor_id')
            ->leftJoinSub($latestOrders, 'latest_orders', function ($join) {
                $join->on('latest_orders.application_id', '=', 'applications.application_id');
            })
            ->leftJoin('orders', function ($join) {
                $join->on('orders.application_id', '=', 'applications.application_id')
                    ->on('orders.created_at', '=', 'latest_orders.max_created_at');
            })
            ->where('event_booths.event_id', $event->event_id)
            ->where('event_booths.is_active', true)
            ->where('event_booths.occupied', true)
            ->whereNotNull('event_booths.occupied_by_application_event_id')
            ->where('application_events.application_status', 'approved')
            ->select([
                'event_booths.booth_id as booth_id',
                DB::raw('MAX(vendors.vendor_name) as vendor_name'),
                DB::raw('MAX(applications.application_id) as application_id'),
                DB::raw('MAX(CASE WHEN orders.is_paid = 1 THEN 1 ELSE 0 END) as is_paid'),
            ])
            ->groupBy('event_booths.booth_id');

        $rows = EventBooths::query()
            ->where('event_booths.event_id', $event->event_id)
            ->where('event_booths.is_active', true)
            ->join('booths', 'event_booths.booth_id', '=', 'booths.booth_id')
            ->join('booth_types', 'booths.booth_type_id', '=', 'booth_types.booth_type_id')
            ->leftJoinSub($occupants, 'occupants', function ($join) {
                $join->on('occupants.booth_id', '=', 'booths.booth_id');
            })
            ->orderBy('booth_types.booth_type_name', 'asc')
            ->orderBy('booths.booth_name', 'asc')
            ->get([
                'booth_types.booth_type_id as booth_type_id',
                'booth_types.booth_type_name as booth_type_name',
                'booths.booth_id as booth_id',
                'booths.booth_name as booth_name',
                'booths.booth_description as booth_description',
                'event_booths.occupied as occupied',
                DB::raw('occupants.vendor_name as vendor_name'),
            ]);

        $groups = $rows
            ->groupBy('booth_type_id')
            ->map(function ($items) {
                $first = $items->first();
                return [
                    'booth_type_id' => $first->booth_type_id,
                    'booth_type_name' => $first->booth_type_name,
                    'booths' => $items->map(function ($row) {
                        return [
                            'booth_id' => $row->booth_id,
                            'booth_name' => $row->booth_name,
                            'occupied' => (bool) $row->occupied,
                            'vendor_name' => $row->vendor_name,
                            'booth_description' => $row->booth_description ?? null,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return Inertia::render('events/layout-overview', [
            'event' => [
                'event_id' => $event->event_id,
                'event_name' => $event->event_name,
                'primary_layout_image' => $event->layoutImages->first()->image_path ?? null,
                'event_layout_images' => $this->serializeLayoutImages($event->layoutImages),
            ],
            'groups' => $groups,
        ]);
    }

    public function publicDetail(Events $event): Response
    {
        $event->load(['location']);

        $totalBooths = (int) EventBooths::query()
            ->where('event_id', $event->event_id)
            ->where('is_active', true)
            ->count();

        $unoccupiedBooths = (int) EventBooths::query()
            ->where('event_id', $event->event_id)
            ->where('is_active', true)
            ->where('occupied', false)
            ->count();

        $occupiedBooths = $totalBooths - $unoccupiedBooths;

        $events = Events::query()
            ->where('is_active', true)
            ->where('event_end_date', '>=', now()->toDateString())
            ->orderBy('event_start_date', 'asc')
            ->get([
                'event_id',
                'event_name',
                'event_date',
                'event_time',
                'venue',
                'event_image',
                'event_start_date',
                'event_end_date',
                'event_description',
            ]);

        $images = array_values(array_filter([(string) ($event->event_image ?? '')]));
        if (empty($images)) {
            $images = ['/empty_image.png'];
        }

        return Inertia::render('events/detail', [
            'event' => $event,
            'events' => $events,
            'images' => $images,
            'boothStats' => [
                'totalBooths' => $totalBooths,
                'occupiedBooths' => $occupiedBooths,
                'unoccupiedBooths' => $unoccupiedBooths,
            ],
        ]);
    }

    public function create(): Response
    {
        $locations = Locations::query()
            ->orderBy('location_name', 'asc')
            ->get(['location_id', 'location_name']);

        $deposits = Deposits::query()
            ->where('deposit_status', 'active')
            ->where('deposit_end_date', '>=', now())
            ->orWhere('deposit_end_date', null)
            ->orderBy('deposit_amount', 'asc')
            ->get(['deposit_id', 'deposit_description', 'deposit_amount']);

        $boothTypes = BoothTypes::query()
            ->where('is_active', true)
            ->orderBy('booth_type_name', 'asc')
            ->get(['booth_type_id', 'booth_type_name']);

        $booths = Booths::query()
            ->where('is_active', true)
            ->orderBy('booth_name', 'asc')
            ->get(['booth_id', 'booth_type_id', 'booth_name']);

        return Inertia::render('events/create', [
            'locations' => $locations,
            'deposits' => $deposits,
            'boothTypes' => $boothTypes,
            'booths' => $booths,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_name' => ['required', 'string', 'max:255'],
            'event_description' => ['nullable', 'string'],
            'event_date' => ['required', 'string', 'max:255'],
            'event_time' => ['required', 'string', 'max:255'],
            'location_id' => ['required', 'uuid', 'exists:locations,location_id'],
            'venue' => ['nullable', 'string', 'max:255'],
            'event_image' => ['nullable', 'image', 'max:5120'],
            'event_booth_layouts' => ['nullable', 'array'],
            'event_booth_layouts.*' => ['image', 'max:5120'],
            'event_start_date' => ['required', 'date'],
            'event_end_date' => ['required', 'date', 'after_or_equal:event_start_date'],
            'require_deposit' => ['nullable', 'boolean'],
            'deposit_id' => ['nullable', 'uuid', 'exists:deposits,deposit_id'],
            'is_active' => ['nullable', 'boolean'],
            'booths' => ['nullable', 'array'],
            'booths.*.booth_id' => ['required', 'uuid', 'exists:booths,booth_id'],
            'booths.*.booth_price' => ['required', 'numeric', 'min:0'],
        ]);

        $event = Events::create([
            'event_name' => $validated['event_name'],
            'event_description' => $validated['event_description'] ?? null,
            'event_date' => $validated['event_date'],
            'event_time' => $validated['event_time'],
            'location_id' => $validated['location_id'],
            'venue' => $validated['venue'] ?? null,
            'event_start_date' => $validated['event_start_date'],
            'event_end_date' => $validated['event_end_date'],
            'require_deposit' => (bool) ($validated['require_deposit'] ?? true),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        if ($request->hasFile('event_booth_layouts')) {
            $this->storeEventLayoutImages(
                $event,
                $request->file('event_booth_layouts'),
            );
        }

        if ($request->hasFile('event_image')) {
            $path = $request->file('event_image')->storePublicly('event_images', 'public');
            $event->update([
                'event_image' => "/storage/{$path}",
            ]);
        }

        if ($validated['require_deposit'] ?? false) {
            $deposit = Deposits::query()->find($validated['deposit_id']);
            EventDeposits::create([
                'event_id' => $event->event_id,
                'deposit_id' => $deposit->deposit_id,
            ]);
        }

        if (!empty($validated['booths'])) {
            foreach ($validated['booths'] as $booth) {
                EventBooths::create([
                    'event_id' => $event->event_id,
                    'booth_id' => $booth['booth_id'],
                    'booth_price' => $booth['booth_price'],
                    'occupied' => false,
                    'is_active' => true,
                ]);
            }
        }

        return redirect('/events');
    }

    public function edit(Events $event): Response
    {
        $event->load(['layoutImages']);

        $locations = Locations::query()
            ->orderBy('location_name', 'asc')
            ->get(['location_id', 'location_name']);

        $deposits = Deposits::query()
            ->where('deposit_status', 'active')
            ->where('deposit_end_date', '>=', now())
            ->orWhere('deposit_end_date', null)
            ->orderBy('deposit_amount', 'asc')
            ->get(['deposit_id', 'deposit_description', 'deposit_amount']);

        $boothTypes = BoothTypes::query()
            ->where('is_active', true)
            ->orderBy('booth_type_name', 'asc')
            ->get(['booth_type_id', 'booth_type_name']);

        $booths = Booths::query()
            ->where('is_active', true)
            ->orderBy('booth_name', 'asc')
            ->get(['booth_id', 'booth_type_id', 'booth_name']);

        $deposit_id = EventDeposits::query()->where('event_id', $event->event_id)->first()->deposit_id ?? null;

        $event->deposit_id = $deposit_id;

        $eventBooths = EventBooths::query()
            ->where('event_id', $event->event_id)
            ->get(['booth_id', 'booth_price']);

        $event->booths = $eventBooths;
        $event->layout_images = $this->serializeLayoutImages($event->layoutImages);

        return Inertia::render('events/[id]', [
            'event' => $event,
            'locations' => $locations,
            'deposits' => $deposits,
            'boothTypes' => $boothTypes,
            'booths' => $booths,
        ]);
    }

    public function update(Request $request, Events $event)
    {
        $validated = $request->validate([
            'event_name' => ['required', 'string', 'max:255'],
            'event_description' => ['nullable', 'string'],
            'event_date' => ['required', 'string', 'max:255'],
            'event_time' => ['required', 'string', 'max:255'],
            'location_id' => ['required', 'uuid', 'exists:locations,location_id'],
            'venue' => ['nullable', 'string', 'max:255'],
            'event_image' => ['nullable', 'image', 'max:5120'],
            'event_booth_layouts' => ['nullable', 'array'],
            'event_booth_layouts.*' => ['image', 'max:5120'],
            'removed_layout_image_ids' => ['nullable', 'array'],
            'removed_layout_image_ids.*' => ['uuid'],
            'event_start_date' => ['required', 'date'],
            'event_end_date' => ['required', 'date', 'after_or_equal:event_start_date'],
            'require_deposit' => ['nullable', 'boolean'],
            'deposit_id' => ['nullable', 'uuid', 'exists:deposits,deposit_id'],
            'is_active' => ['nullable', 'boolean'],
            'booths' => ['nullable', 'array'],
            'booths.*.booth_id' => ['required', 'uuid', 'exists:booths,booth_id'],
            'booths.*.booth_price' => ['required', 'numeric', 'min:0'],
        ]);

        $event->update([
            'event_name' => $validated['event_name'],
            'event_description' => $validated['event_description'] ?? null,
            'event_date' => $validated['event_date'],
            'event_time' => $validated['event_time'],
            'location_id' => $validated['location_id'],
            'venue' => $validated['venue'] ?? null,
            'event_start_date' => $validated['event_start_date'],
            'event_end_date' => $validated['event_end_date'],
            'require_deposit' => (bool) ($validated['require_deposit'] ?? false),
            'is_active' => (bool) ($validated['is_active'] ?? false),
        ]);

        $removedLayoutImageIds = $validated['removed_layout_image_ids'] ?? [];
        if (!empty($removedLayoutImageIds)) {
            $this->removeEventLayoutImages($event, $removedLayoutImageIds);
        }

        if ($request->hasFile('event_booth_layouts')) {
            $this->storeEventLayoutImages(
                $event,
                $request->file('event_booth_layouts'),
            );
        }

        if ($request->hasFile('event_image')) {
            $path = $request->file('event_image')->storePublicly('event_images', 'public');
            $event->update([
                'event_image' => "/storage/{$path}",
            ]);
        }

        if ($validated['require_deposit'] ?? false) {
            $deposit = Deposits::query()->find($validated['deposit_id']);
            EventDeposits::create([
                'event_id' => $event->event_id,
                'deposit_id' => $deposit->deposit_id,
            ]);
        }

        $existingBooths = EventBooths::query()->where('event_id', $event->event_id)->get();
        $existingBoothIds = $existingBooths->pluck('booth_id')->toArray();

        $newBooths = $validated['booths'] ?? [];
        $newBoothIds = array_column($newBooths, 'booth_id');

        $boothsToDelete = array_diff($existingBoothIds, $newBoothIds);
        if (!empty($boothsToDelete)) {
            EventBooths::query()->where('event_id', $event->event_id)->whereIn('booth_id', $boothsToDelete)->delete();
        }

        foreach ($newBooths as $newBooth) {
            $existing = $existingBooths->firstWhere('booth_id', $newBooth['booth_id']);
            if ($existing) {
                if ($existing->booth_price != $newBooth['booth_price']) {
                    $existing->update(['booth_price' => $newBooth['booth_price']]);
                }
            } else {
                EventBooths::create([
                    'event_id' => $event->event_id,
                    'booth_id' => $newBooth['booth_id'],
                    'booth_price' => $newBooth['booth_price'],
                    'occupied' => false,
                    'is_active' => true,
                ]);
            }
        }

        return redirect()->back()->with('success', "Event updated.");
    }

    public function destroy(Events $event)
    {
        Events::query()->where('event_id', $event->event_id)->delete();

        return redirect('/events');
    }

    public function eventsList()
    {
        $events = Events::query()
            ->where('is_active', true)
            ->where('event_end_date', '>=', date('Y-m-d'))
            ->orderBy('event_start_date', 'asc')
            ->get(['event_id', 'event_name', 'event_date', 'event_time', 'venue', 'event_image', 'event_start_date']);

        return response()->json($events);
    }

    private function serializeLayoutImages(iterable $images): array
    {
        return collect($images)
            ->map(function ($image) {
                return [
                    'event_layout_image_id' => $image->event_layout_image_id,
                    'image_path' => $image->image_path,
                    'sort_order' => (int) $image->sort_order,
                ];
            })
            ->values()
            ->all();
    }

    private function storeEventLayoutImages(Events $event, array $files): void
    {
        $nextSortOrder = (int) (
            EventLayoutImage::query()
            ->where('event_id', $event->event_id)
            ->max('sort_order') ?? -1
        ) + 1;

        foreach ($files as $index => $file) {
            $path = $file->storePublicly('event_booth_layouts', 'public');

            EventLayoutImage::create([
                'event_id' => $event->event_id,
                'image_path' => "/storage/{$path}",
                'sort_order' => $nextSortOrder + $index,
                'is_active' => true,
            ]);
        }
    }

    private function removeEventLayoutImages(Events $event, array $imageIds): void
    {
        $images = EventLayoutImage::query()
            ->where('event_id', $event->event_id)
            ->whereIn('event_layout_image_id', $imageIds)
            ->get();

        foreach ($images as $image) {
            $storagePath = $this->storagePathFromPublicUrl($image->image_path);
            if ($storagePath !== null) {
                Storage::disk('public')->delete($storagePath);
            }

            $image->delete();
        }
    }

    private function storagePathFromPublicUrl(?string $url): ?string
    {
        if (!$url || !str_starts_with($url, '/storage/')) {
            return null;
        }

        return ltrim(substr($url, strlen('/storage/')), '/');
    }
}
