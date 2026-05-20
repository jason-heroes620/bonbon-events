<?php

namespace App\Http\Controllers;

use App\Models\Deposits;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepositController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $deposits = Deposits::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('deposit_description', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('configurations/deposits/deposits', [
            'deposits' => $deposits,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('configurations/deposits/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'deposit_description' => ['required', 'string', 'max:255'],
            'deposit_amount' => ['required', 'numeric', 'min:0'],
            'deposit_start_date' => ['required', 'date'],
            'deposit_end_date' => ['nullable', 'date_format:H:i'],
            'deposit_status' => ['required', 'in:active,inactive'],
        ]);

        Deposits::create([
            'deposit_description' => $validated['deposit_description'],
            'deposit_amount' => (string) $validated['deposit_amount'],
            'deposit_start_date' => $validated['deposit_start_date'],
            'deposit_end_date' => $validated['deposit_end_date'] ?? null,
            'deposit_status' => $validated['deposit_status'],
        ]);

        return redirect('/deposits');
    }

    public function edit(Deposits $deposit): Response
    {
        return Inertia::render('configurations/deposits/[id]', [
            'deposit' => $deposit,
        ]);
    }

    public function update(Request $request, Deposits $deposit)
    {
        $validated = $request->validate([
            'deposit_description' => ['required', 'string', 'max:255'],
            'deposit_amount' => ['required', 'numeric', 'min:0'],
            'deposit_start_date' => ['required', 'date'],
            'deposit_end_date' => ['nullable', 'date_format:H:i'],
            'deposit_status' => ['required', 'in:active,inactive'],
        ]);

        $deposit->update([
            'deposit_description' => $validated['deposit_description'],
            'deposit_amount' => (string) $validated['deposit_amount'],
            'deposit_start_date' => $validated['deposit_start_date'],
            'deposit_end_date' => $validated['deposit_end_date'] ?? null,
            'deposit_status' => $validated['deposit_status'],
        ]);

        return redirect('/deposits');
    }

    public function destroy(Deposits $deposit)
    {
        Deposits::query()->where('deposit_id', $deposit->deposit_id)->delete();

        return redirect('/deposits');
    }
}
