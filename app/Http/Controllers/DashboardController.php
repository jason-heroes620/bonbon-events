<?php

namespace App\Http\Controllers;

use App\Models\Applications;
use App\Models\EventBooths;
use App\Models\Events;
use App\Models\Payments;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    //
    public function index(Request $request)
    {
        $pendingApplicationsCount = Applications::query()
            ->where('application_status', 'pending')
            ->count();

        $upcomingEvents = Events::query()
            ->where('is_active', true)
            ->whereDate('event_start_date', '>=', now()->toDateString())
            ->orderBy('event_start_date')
            ->limit(5)
            ->get([
                'event_id',
                'event_name',
                'event_start_date',
                'event_end_date',
            ]);

        $eventIds = $upcomingEvents->pluck('event_id')->filter()->values()->all();

        $boothStats = collect();
        if (count($eventIds) > 0) {
            $boothStats = EventBooths::query()
                ->select([
                    'event_id',
                    DB::raw('COUNT(*) as total_booths'),
                    DB::raw('SUM(CASE WHEN occupied = 1 THEN 1 ELSE 0 END) as occupied_booths'),
                ])
                ->whereIn('event_id', $eventIds)
                ->where('is_active', true)
                ->groupBy('event_id')
                ->get()
                ->keyBy('event_id');
        }

        $upcomingEventsWithBooths = $upcomingEvents->map(function ($event) use ($boothStats) {
            $row = $boothStats->get($event->event_id);

            $total = (int) ($row->total_booths ?? 0);
            $occupied = (int) ($row->occupied_booths ?? 0);

            return [
                'event_id' => $event->event_id,
                'event_name' => $event->event_name,
                'event_start_date' => optional($event->event_start_date)->format('Y-m-d'),
                'event_end_date' => optional($event->event_end_date)->format('Y-m-d'),
                'total_booths' => $total,
                'occupied_booths' => $occupied,
                'unoccupied_booths' => max(0, $total - $occupied),
            ];
        });

        $startOfMonth = now()->startOfMonth()->toDateString();
        $endOfMonth = now()->endOfMonth()->toDateString();

        $currentMonthRevenue = (float) Payments::query()
            ->where('payment_status', true)
            ->whereDate('payment_date', '>=', $startOfMonth)
            ->whereDate('payment_date', '<=', $endOfMonth)
            ->sum('payment_amount');

        return Inertia::render('Dashboard', [
            'pendingApplicationsCount' => $pendingApplicationsCount,
            'upcomingEvents' => $upcomingEventsWithBooths,
            'currentMonthRevenue' => $currentMonthRevenue,
            'currentMonthLabel' => now()->format('F Y'),
            'currency' => (string) (config('services.ipay88.currency') ?? env('IPAY88_CURRENCY') ?? 'MYR'),
        ]);
    }
}
