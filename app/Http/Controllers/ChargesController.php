<?php

namespace App\Http\Controllers;

use App\Models\Charges;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChargesController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $charges = Charges::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('charges_name', 'like', "%{$search}%")
                        ->orWhere('charges_description', 'like', "%{$search}%");
                });
            })
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('configurations/charges/charges', [
            'charges' => $charges,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('configurations/charges/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'charges_name' => ['required', 'string', 'max:255'],
            'charges_type' => ['required', 'in:F,P'],
            'charges_rate' => ['required', 'numeric', 'min:0'],
            'charges_description' => ['nullable', 'string', 'max:255'],
            'charges_start_date' => ['required', 'date'],
            'charges_end_date' => ['nullable', 'date', 'after_or_equal:charges_start_date'],
            'charges_status' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:1', 'max:127'],
        ]);

        Charges::create([
            'charges_name' => $validated['charges_name'],
            'charges_type' => $validated['charges_type'],
            'charges_rate' => (string) $validated['charges_rate'],
            'charges_description' => $validated['charges_description'] ?? null,
            'charges_start_date' => $validated['charges_start_date'],
            'charges_end_date' => $validated['charges_end_date'] ?? null,
            'charges_status' => (bool) ($validated['charges_status'] ?? true),
            'sort_order' => (int) ($validated['sort_order'] ?? 1),
        ]);

        return redirect('/charges');
    }

    public function edit(Charges $charge): Response
    {
        return Inertia::render('configurations/charges/[id]', [
            'charge' => $charge,
        ]);
    }

    public function update(Request $request, Charges $charge)
    {
        $validated = $request->validate([
            'charges_name' => ['required', 'string', 'max:255'],
            'charges_type' => ['required', 'in:F,P'],
            'charges_rate' => ['required', 'numeric', 'min:0'],
            'charges_description' => ['nullable', 'string', 'max:255'],
            'charges_start_date' => ['required', 'date'],
            'charges_end_date' => ['nullable', 'date', 'after_or_equal:charges_start_date'],
            'charges_status' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:1', 'max:127'],
        ]);

        $charge->update([
            'charges_name' => $validated['charges_name'],
            'charges_type' => $validated['charges_type'],
            'charges_rate' => (string) $validated['charges_rate'],
            'charges_description' => $validated['charges_description'] ?? null,
            'charges_start_date' => $validated['charges_start_date'],
            'charges_end_date' => $validated['charges_end_date'] ?? null,
            'charges_status' => (bool) ($validated['charges_status'] ?? true),
            'sort_order' => (int) ($validated['sort_order'] ?? 1),
        ]);

        return redirect('/charges');
    }

    public function destroy(Charges $charge)
    {
        Charges::query()->where('charges_id', $charge->charges_id)->delete();

        return redirect('/charges');
    }
}
