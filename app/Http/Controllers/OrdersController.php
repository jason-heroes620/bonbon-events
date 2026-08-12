<?php

namespace App\Http\Controllers;

use App\Models\Applications;
use App\Models\Invoices;
use App\Models\OrderCharges;
use App\Models\OrderItems;
use App\Models\Orders;
use App\Models\Payments;
use App\Services\ActivityLogService;
use App\Services\InvoiceService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrdersController extends Controller
{
    public function __construct(
        private InvoiceService $invoiceService,
        private ActivityLogService $activityLogService,
    ) {}

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
            ->leftJoin('applications', 'orders.application_id', '=', 'applications.application_id')
            ->leftJoin('vendors', 'applications.vendor_id', '=', 'vendors.vendor_id')
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
                'vendors.vendor_name as vendor_name',
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

        $payment = Payments::query()
            ->where('order_id', $order->order_id)
            ->orderByDesc('created_at')
            ->first([
                'payment_id',
                'transaction_id',
                'payment_amount',
                'payment_date',
                'payment_method',
                'payment_file',
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
            'payment' => $payment,
        ]);
    }

    public function updatePayment(Request $request, Orders $order)
    {
        $validated = $request->validate([
            'transaction_id' => ['required', 'string', 'max:50'],
            'payment_amount' => ['required', 'numeric', 'min:0'],
            'payment_date' => ['required', 'date'],
            'payment_method' => ['required', 'string', 'max:255'],
            'payment_file' => ['required', 'file', 'max:5120'],
        ]);

        if (! (bool) ($order->is_active ?? false)) {
            throw ValidationException::withMessages([
                'order' => ['Order is no longer active.'],
            ]);
        }

        if ((bool) ($order->is_paid ?? false)) {
            throw ValidationException::withMessages([
                'order' => ['Order is already paid.'],
            ]);
        }

        if (! $order->application_id) {
            throw ValidationException::withMessages([
                'order' => ['Order has no application linked.'],
            ]);
        }

        $hasOrderItems = OrderItems::query()
            ->where('order_id', $order->order_id)
            ->where('is_active', true)
            ->exists();

        if (! $hasOrderItems) {
            throw ValidationException::withMessages([
                'order' => ['Order has no items. Please confirm booths first.'],
            ]);
        }

        $paymentFilePath = null;
        if ($request->hasFile('payment_file')) {
            $path = $request->file('payment_file')->storePublicly('payments', 'public');
            $paymentFilePath = "/storage/{$path}";
        }

        $application = Applications::query()
            ->where('application_id', $order->application_id)
            ->first(['application_id', 'application_code']);

        if (! $application) {
            throw ValidationException::withMessages([
                'order' => ['Application not found for this order.'],
            ]);
        }

        $invoice = null;

        DB::transaction(function () use ($order, $application, $validated, $paymentFilePath, &$invoice) {
            /** @var Invoices $invoice */
            $invoice = $this->invoiceService->upsertInvoiceForOrder($order, $application);

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

        $this->activityLogService->logActivity(
            applicationCode: (string) $application->application_code,
            activityType: 'Payment Updated',
            activityDescription: 'Payment updated via order detail: ' . (string) ($invoice?->invoice_no ?? ''),
            userId: (string) ($request->user()?->user_id ?? ''),
        );

        return redirect()->back();
    }

    public function showPaid(Orders $order): Response
    {
        $order = Orders::query()
            ->where('order_no', $order->order_no)
            ->first();
        $items = OrderItems::query()
            ->where('order_id', $order->order_id)
            ->orderBy('created_at')
            ->get([
                'order_item_id',
                'quantity',
                'price',
                'item_description',
            ]);

        return Inertia::render('payments/[code]', [
            'order' => $order,
            'items' => $items,
        ]);
    }
}
