<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ApplicationEvent;
use App\Models\EventBooths;
use Illuminate\Support\Facades\Log;

class EventBoothsController extends Controller {

    public function booth(Request $request, string $event_id, string $booth_id) {
        $booth = EventBooths::query()
            ->where('event_id', $event_id)
            ->where('booth_id', $booth_id)
            ->first();

        if (!$booth) {
            return response()->json([
                'error' => 'Booth not found for this event.',
            ], 404);
        }

        $payload = $booth->toArray();
        $payload['occupied'] = (bool) ($payload['occupied'] ?? false);
        $payload['occupied_by_vendor'] = null;

        if ($payload['occupied']) {
            $vendor = ApplicationEvent::query()
                ->leftJoin('applications', 'application_events.application_id', '=', 'applications.application_id')
                ->leftJoin('vendors', 'applications.vendor_id', '=', 'vendors.vendor_id')
                ->where('application_events.application_event_id', $booth->occupied_by_application_event_id)
                ->first();

            if (!$vendor) {
                Log::error('Unknown vendor found for booth ' . $booth_id);
            }

            $payload['occupied_by_vendor'] = $vendor?->vendor_name;
        }

        return response()->json($payload);
    }
}
