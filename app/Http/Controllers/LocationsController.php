<?php

namespace App\Http\Controllers;

use App\Models\Locations;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LocationsController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $locations = Locations::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('location_name', 'like', "%{$search}%")
                        ->orWhere('location_description', 'like', "%{$search}%");
                });
            })
            ->orderBy('location_name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('configurations/locations/locations', [
            'locations' => $locations,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('configurations/locations/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'location_name' => ['required', 'string', 'max:255'],
            'location_description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        Locations::create([
            'location_name' => $validated['location_name'],
            'location_description' => $validated['location_description'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect('/locations');
    }

    public function edit(Locations $location): Response
    {
        return Inertia::render('configurations/locations/[id]', [
            'location' => $location,
        ]);
    }

    public function update(Request $request, Locations $location)
    {
        $validated = $request->validate([
            'location_name' => ['required', 'string', 'max:255'],
            'location_description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $location->update([
            'location_name' => $validated['location_name'],
            'location_description' => $validated['location_description'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? false),
        ]);

        return redirect('/locations');
    }

    public function destroy(Locations $location)
    {
        Locations::query()->where('location_id', $location->location_id)->delete();

        return redirect('/locations');
    }
}
