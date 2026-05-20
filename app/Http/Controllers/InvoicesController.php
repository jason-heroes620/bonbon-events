<?php

namespace App\Http\Controllers;

use App\Models\Invoices;
use App\Models\OrderItems;
use App\Models\Orders;
use Illuminate\Http\Request;
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
        $order = Orders::query()
            ->where('order_id', $invoice->order_id)
            ->first([
                'order_id',
                'order_no',
                'application_id',
                'application_code',
                'total_price',
                'discount_price',
                'is_paid',
                'created_at',
            ]);

        $items = OrderItems::query()
            ->where('order_id', $invoice->order_id)
            ->orderBy('created_at')
            ->get([
                'order_item_id',
                'quantity',
                'price',
                'item_description',
            ]);

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
        ]);
    }
}
