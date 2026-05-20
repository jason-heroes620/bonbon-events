<?php

namespace App\Http\Controllers;

use App\Models\InvoiceNo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceNoController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $invoiceNos = InvoiceNo::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('prefix', 'like', "%{$search}%")
                        ->orWhere('invoice_no', 'like', "%{$search}%")
                        ->orWhere('suffix', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('configurations/invoice_nos/invoice_nos', [
            'invoiceNos' => $invoiceNos,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('configurations/invoice_nos/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'prefix' => ['required', 'string', 'max:20'],
            'invoice_no' => ['required', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:255'],
        ]);

        InvoiceNo::create([
            'prefix' => $validated['prefix'],
            'invoice_no' => $validated['invoice_no'],
            'suffix' => $validated['suffix'] ?? '0',
            'length' => $invoiceNo->length ?? 6,
        ]);

        return redirect('/invoice-nos');
    }

    public function edit(InvoiceNo $invoiceNo): Response
    {
        return Inertia::render('configurations/invoice_nos/[id]', [
            'invoiceNo' => $invoiceNo,
        ]);
    }

    public function update(Request $request, InvoiceNo $invoiceNo)
    {
        $validated = $request->validate([
            'prefix' => ['required', 'string', 'max:20'],
            'invoice_no' => ['required', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:255'],
            'length' => ['nullable', 'integer', 'min:1', 'max:255'],
        ]);

        $invoiceNo->update([
            'prefix' => $validated['prefix'],
            'invoice_no' => $validated['invoice_no'],
            'suffix' => $validated['suffix'] ?? '0',
            'length' => $invoiceNo->length ?? 6,
        ]);

        return redirect('/invoice-nos');
    }

    public function destroy(InvoiceNo $invoiceNo)
    {
        InvoiceNo::query()
            ->where('invoice_no_id', $invoiceNo->invoice_no_id)
            ->delete();

        return redirect('/invoice-nos');
    }
}
