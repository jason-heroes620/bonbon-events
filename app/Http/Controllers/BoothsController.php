<?php

namespace App\Http\Controllers;

use App\Models\Booths;
use App\Models\BoothTypes;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BoothsController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $booths = Booths::query()
            ->with(['boothType'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('booth_name', 'like', "%{$search}%")
                        ->orWhere('booth_description', 'like', "%{$search}%")
                        ->orWhereHas('boothType', function ($query) use ($search) {
                            $query->where('booth_type_name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('booth_name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('configurations/booths/booths', [
            'booths' => $booths,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        $boothTypes = BoothTypes::query()
            ->orderBy('booth_type_name', 'asc')
            ->get(['booth_type_id', 'booth_type_name']);

        return Inertia::render('configurations/booths/create', [
            'boothTypes' => $boothTypes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'booth_type_id' => ['required', 'uuid', 'exists:booth_types,booth_type_id'],
            'booth_name' => ['required', 'string', 'max:255'],
            'booth_description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        Booths::create([
            'booth_type_id' => $validated['booth_type_id'],
            'booth_name' => $validated['booth_name'],
            'booth_description' => $validated['booth_description'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect('/booths');
    }

    public function edit(Booths $booth): Response
    {
        $boothTypes = BoothTypes::query()
            ->orderBy('booth_type_name', 'asc')
            ->get(['booth_type_id', 'booth_type_name']);

        $booth->load(['boothType']);

        return Inertia::render('configurations/booths/[id]', [
            'booth' => $booth,
            'boothTypes' => $boothTypes,
        ]);
    }

    public function update(Request $request, Booths $booth)
    {
        $validated = $request->validate([
            'booth_type_id' => ['required', 'uuid', 'exists:booth_types,booth_type_id'],
            'booth_name' => ['required', 'string', 'max:255'],
            'booth_description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $booth->update([
            'booth_type_id' => $validated['booth_type_id'],
            'booth_name' => $validated['booth_name'],
            'booth_description' => $validated['booth_description'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? false),
        ]);

        return redirect('/booths');
    }

    public function destroy(Booths $booth)
    {

        Booths::query()->where('booth_id', $booth->booth_id)->delete();

        return redirect('/booths');
    }
}
