<?php

namespace App\Http\Controllers;

use App\Models\Invoices;
use App\Models\OrderCharges;
use App\Models\OrderItems;
use App\Models\Orders;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrdersController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $latestInvoiceTimes = Invoices::query()
            ->select('order_id', DB::raw('MAX(created_at) as max_created_at'))
            ->groupBy('order_id');

        $orders = Orders::query()
            ->leftJoinSub(
                $latestInvoiceTimes,
                'latest_invoices',
                'orders.order_id',
                '=',
                'latest_invoices.order_id',
            )
            ->leftJoin('invoices', function ($join) {
                $join->on('orders.order_id', '=', 'invoices.order_id', 'and', false)
                    ->on('invoices.created_at', '=', 'latest_invoices.max_created_at', 'and', false);
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('orders.order_no', 'like', "%{$search}%")
                        ->orWhere('orders.application_code', 'like', "%{$search}%")
                        ->orWhere('invoices.invoice_no', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('orders.created_at')
            ->paginate(10, [
                'orders.order_id',
                'orders.order_no',
                'orders.application_id',
                'orders.application_code',
                'orders.sub_total',
                'orders.total_price',
                'orders.discount_price',
                'orders.charges_total',
                'orders.is_paid',
                'orders.is_active',
                'orders.created_at',
                'invoices.invoice_id as invoice_id',
                'invoices.invoice_no as invoice_no',
                'invoices.invoice_status as invoice_status',
            ])
            ->withQueryString();

        return Inertia::render('orders/orders', [
            'orders' => $orders,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function show(Orders $order): Response
    {
        $invoice = Invoices::query()
            ->where('order_id', $order->order_id)
            ->orderByDesc('created_at')
            ->first([
                'invoice_id',
                'invoice_no',
                'invoice_date',
                'discount_amount',
                'invoice_amount',
                'invoice_status',
            ]);

        $items = OrderItems::query()
            ->where('order_id', $order->order_id)
            ->orderBy('created_at')
            ->get([
                'order_item_id',
                'quantity',
                'price',
                'item_description',
            ]);

        $charges = OrderCharges::query()
            ->where('order_id', $order->order_id)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get([
                'order_charge_id',
                'charges_name',
                'charges_type',
                'charges_rate',
                'charges_amount',
                'sort_order',
            ]);

        return Inertia::render('orders/[id]', [
            'order' => $order->only([
                'order_id',
                'order_no',
                'application_id',
                'application_code',
                'sub_total',
                'total_price',
                'discount_price',
                'charges_total',
                'is_paid',
                'is_active',
                'created_at',
            ]),
            'invoice' => $invoice,
            'items' => $items,
            'charges' => $charges,
        ]);
    }
}
