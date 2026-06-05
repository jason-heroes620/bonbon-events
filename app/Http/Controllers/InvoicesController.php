<?php

namespace App\Http\Controllers;

use App\Models\Invoices;
use App\Models\OrderItems;
use App\Models\Orders;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class InvoicesController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $invoices = Invoices::query()
            ->leftJoin('orders', 'invoices.order_id', '=', 'orders.order_id')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('invoices.invoice_no', 'like', "%{$search}%")
                        ->orWhere('orders.order_no', 'like', "%{$search}%")
                        ->orWhere('invoices.application_id', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('invoices.created_at')
            ->paginate(10, [
                'invoices.invoice_id',
                'invoices.invoice_no',
                'invoices.invoice_date',
                'invoices.invoice_status',
                'invoices.invoice_amount',
                'invoices.order_id',
                'invoices.application_id',
                'invoices.created_at',
                'orders.order_no as order_no',
                'orders.is_paid as is_paid',
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
        [$order, $items, $subtotal, $discount, $total, $application, $vendor, $eventName] = $this->getInvoice($invoice);

        return Inertia::render('invoices/[id]', [
            'invoice' => $invoice->only([
                'invoice_id',
                'invoice_no',
                'invoice_date',
                'discount_amount',
                'invoice_amount',
                'invoice_status',
                'order_id',
                'application_id',
                'created_at',
            ]),
            'order' => $order,
            'items' => $items,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
            'eventName' => $eventName,
            'vendor' => $vendor,
        ]);
    }

    public function previewInvoice(Invoices $invoice)
    {
        [$order, $items, $subtotal, $discount, $total, $application, $vendor, $eventName] = $this->getInvoice($invoice);

        return view('invoices.template', [
            'order' => $order,
            'invoice' => $invoice,
            'business_name' => $vendor?->business_name,
            'vendor' => $vendor,
            'items' => $items,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
            'eventName' => $eventName,
        ]);
    }

    private function getInvoice(Invoices $invoice)
    {
        $invoice->invoice_status = strtoupper($invoice->invoice_status);

        $order = Orders::query()
            ->with(['application.vendor', 'application.event'])
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

        $subtotal = (float) $items->sum(fn($item) => (float) $item->price * (int) $item->quantity);
        $discount = (float) ($invoice->discount_amount ?? $order->discount_price ?? 0);
        $total = (float) ($invoice->invoice_amount ?? $order->total_price ?? max(0, $subtotal - $discount));

        $application = $order->application;
        $vendor = $application?->vendor;
        $eventName = $application?->event?->event_name;

        return [$order, $items, $subtotal, $discount, $total, $application, $vendor, $eventName];
    }
}
