<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Applications;
use App\Models\Invoices;
use App\Models\OrderCharges;
use App\Models\OrderItems;
use App\Models\Orders;
use App\Models\Payments;
use App\Models\Vendors;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class VendorOrdersController extends Controller
{
    public function index(Request $request): Response
    {
        $vendorId = $this->vendorIdOrFail($request);
        $search = $request->string('search')->toString();

        $latestInvoiceTimes = Invoices::query()
            ->select([
                'order_id',
                DB::raw('MAX(created_at) as max_created_at'),
            ])
            ->groupBy('order_id');

        $orders = Orders::query()
            ->join('applications', 'orders.application_id', '=', 'applications.application_id', 'inner', false)
            ->where('applications.vendor_id', $vendorId)
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

        return Inertia::render('vendor/orders/orders', [
            'orders' => $orders,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function show(Orders $order, Request $request): Response
    {
        $vendorId = $this->vendorIdOrFail($request);

        $applicationVendorId = Applications::query()
            ->where('application_id', $order->application_id)
            ->value('vendor_id');

        if ($applicationVendorId !== $vendorId) {
            abort(403);
        }

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

        $payment = null;
        if ($order->is_paid) {
            $payment = Payments::query()
                ->where('order_id', $order->order_id)
                ->orderByDesc('payment_date')
                ->orderByDesc('created_at')
                ->first([
                    'payment_id',
                    'transaction_id',
                    'payment_amount',
                    'payment_date',
                    'payment_method',
                    'payment_file',
                ]);
        }

        return Inertia::render('vendor/orders/[id]', [
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
            'payment' => $payment,
        ]);
    }

    private function vendorIdOrFail(Request $request): string
    {
        $user = $request->user();

        $vendorId = Vendors::query()
            ->where('user_id', $user?->user_id)
            ->value('vendor_id');

        if (!$vendorId) {
            abort(403);
        }

        return (string) $vendorId;
    }
}
