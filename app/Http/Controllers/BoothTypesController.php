<?php

namespace App\Http\Controllers;

use App\Models\BoothTypes;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BoothTypesController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $boothTypes = BoothTypes::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where('booth_type_name', 'like', "%{$search}%");
            })
            ->orderBy('booth_type_name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('configurations/booth_types/booth_types', [
            'boothTypes' => $boothTypes,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('configurations/booth_types/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'booth_type_name' => ['required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        BoothTypes::create([
            'booth_type_name' => $validated['booth_type_name'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect('/booth-types');
    }

    public function edit(BoothTypes $boothType): Response
    {
        return Inertia::render('configurations/booth_types/[id]', [
            'boothType' => $boothType,
        ]);
    }

    public function update(Request $request, BoothTypes $boothType)
    {
        $validated = $request->validate([
            'booth_type_name' => ['required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $boothType->update([
            'booth_type_name' => $validated['booth_type_name'],
            'is_active' => (bool) ($validated['is_active'] ?? false),
        ]);

        return redirect('/booth-types');
    }

    public function destroy(BoothTypes $boothType)
    {
        BoothTypes::query()->where('booth_type_id', $boothType->booth_type_id)->delete();

        return redirect('/booth-types');
    }
}
