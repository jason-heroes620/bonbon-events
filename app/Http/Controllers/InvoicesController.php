<?php

namespace App\Http\Controllers;

use App\Models\Invoices;
use App\Models\InvoiceCharges;
use App\Models\OrderItems;
use App\Models\OrderCharges;
use App\Models\Orders;
use App\Models\Payments;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InvoicesController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $invoices = Invoices::query()
            ->leftJoin('orders', 'invoices.order_id', '=', 'orders.order_id')
            ->leftJoin('applications', 'orders.application_id', '=', 'applications.application_id')
            ->leftJoin('vendors', 'applications.vendor_id', '=', 'vendors.vendor_id')
            ->leftJoin('payments', 'orders.order_id', '=', 'payments.order_id')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('invoices.invoice_no', 'like', "%{$search}%")
                        ->orWhere('orders.order_no', 'like', "%{$search}%")
                        ->orWhere('invoices.application_id', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('invoices.invoice_no')
            ->paginate(10, [
                'invoices.invoice_id',
                'invoices.invoice_no',
                'invoices.invoice_date',
                'invoices.invoice_status',
                'invoices.sub_total',
                'invoices.charges_total',
                'invoices.invoice_amount',
                'invoices.order_id',
                'invoices.application_id',
                'invoices.created_at',
                'orders.order_no as order_no',
                'orders.is_paid as is_paid',
                'vendors.vendor_name as vendor_name',
                'payments.payment_date as payment_date',
            ])
            ->withQueryString();

        return Inertia::render('invoices/invoices', [
            'invoices' => $invoices,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function show(Invoices $invoice): Response
    {
        [$order, $items, $charges, $subtotal, $discount, $total, $vendor, $eventName] = $this->getInvoice($invoice);

        $payment = null;
        if ($invoice->order_id) {
            $payment = Payments::query()
                ->where('order_id', $invoice->order_id)
                ->orderByDesc('created_at')
                ->first([
                    'payment_id',
                    'transaction_id',
                    'payment_amount',
                    'payment_date',
                    'payment_method',
                    'payment_file',
                    'created_at',
                ]);
        }

        return Inertia::render('invoices/[id]', [
            'invoice' => $invoice->only([
                'invoice_id',
                'invoice_no',
                'invoice_date',
                'sub_total',
                'discount_amount',
                'charges_total',
                'invoice_amount',
                'invoice_status',
                'order_id',
                'application_id',
                'created_at',
            ]),
            'order' => $order,
            'items' => $items,
            'charges' => $charges,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
            'eventName' => $eventName,
            'vendor' => $vendor,
            'payment' => $payment,
        ]);
    }

    public function updatePayment(Request $request, Invoices $invoice)
    {
        $validated = $request->validate([
            'transaction_id' => ['required', 'string', 'max:50'],
            'payment_amount' => ['required', 'numeric', 'min:0'],
            'payment_date' => ['required', 'date'],
            'payment_method' => ['required', 'string', 'max:255'],
            'payment_file' => ['required', 'file', 'max:5120'],
        ]);

        if (!$invoice->order_id) {
            throw ValidationException::withMessages([
                'invoice' => ['Invoice has no order attached.'],
            ]);
        }

        $order = Orders::query()->where('order_id', $invoice->order_id)->first();
        if (!$order) {
            throw ValidationException::withMessages([
                'order' => ['Order not found for this invoice.'],
            ]);
        }

        $paymentFilePath = null;
        if ($request->hasFile('payment_file')) {
            $path = $request->file('payment_file')->storePublicly('payments', 'public');
            $paymentFilePath = "/storage/{$path}";
        }

        DB::transaction(function () use ($invoice, $order, $validated, $paymentFilePath) {
            Payments::create([
                'order_id' => $order->order_id,
                'order_no' => $order->order_no,
                'transaction_id' => $validated['transaction_id'],
                'payment_amount' => (float) $validated['payment_amount'],
                'payment_date' => Carbon::parse((string) $validated['payment_date'])->startOfDay()->toDateTimeString(),
                'payment_method' => $validated['payment_method'],
                'payment_file' => $paymentFilePath,
                'payment_status' => 1,
            ]);

            $order->update([
                'is_paid' => true,
            ]);

            $invoice->update([
                'invoice_status' => 'paid',
            ]);
        });

        return redirect()->back();
    }

    public function previewInvoice(Invoices $invoice)
    {
        [$order, $items, $charges, $subtotal, $discount, $total, $vendor, $eventName] = $this->getInvoice($invoice);

        return view('invoices.template', [
            'order' => $order,
            'invoice' => $invoice,
            'vendor' => $vendor,
            'items' => $items,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'charges' => $charges,
            'total' => $total,
            'eventName' => $eventName,
        ]);
    }

    private function getInvoice(Invoices $invoice)
    {
        $invoice->invoice_status = strtoupper($invoice->invoice_status);

        $order = Orders::query()
            ->with(['application.vendor', 'application.events.event'])
            ->where('order_id', $invoice->order_id)
            ->firstOrFail();

        $items = OrderItems::query()
            ->where('order_id', $order->order_id)
            ->orderBy('created_at')
            ->get([
                'order_item_id',
                'quantity',
                'price',
                'item_description',
            ]);

        $charges = InvoiceCharges::query()
            ->where('invoice_id', $invoice->invoice_id)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get([
                'invoice_charge_id',
                'charges_name',
                'charges_type',
                'charges_rate',
                'charges_amount',
                'sort_order',
            ]);

        if ($charges->isEmpty()) {
            $charges = OrderCharges::query()
                ->where('order_id', $order->order_id)
                ->orderBy('sort_order')
                ->orderBy('created_at')
                ->get([
                    'order_charge_id as invoice_charge_id',
                    'charges_name',
                    'charges_type',
                    'charges_rate',
                    'charges_amount',
                    'sort_order',
                ]);
        }

        $subtotal = (float) ($invoice->sub_total ?? $order->sub_total ?? $items->sum(fn($item) => (float) $item->price * (int) $item->quantity));
        $discount = (float) ($invoice->discount_amount ?? $order->discount_price ?? 0);
        $total = (float) ($invoice->invoice_amount ?? $order->total_price ?? max(0, $subtotal - $discount));

        $application = $order->application;
        $vendor = $application?->vendor;
        $eventName = $application?->events
            ?->map(fn($ae) => $ae->event?->event_name)
            ->filter()
            ->values()
            ->join(', ');

        return [$order, $items, $charges, $subtotal, $discount, $total, $vendor, $eventName];
    }
}
