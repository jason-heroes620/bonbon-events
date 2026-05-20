<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Applications;
use App\Models\InvoiceNo;
use App\Models\Invoices;
use App\Models\OrderItems;
use App\Models\Orders;
use App\Models\Payments;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaymentController extends Controller
{
    private function ipay88MerchantCode(): string
    {
        return (string) (config('services.ipay88.merchant_code')
            ?? env('IPAY88_MERCHANT_CODE')
            ?? '');
    }

    private function ipay88MerchantKey(): string
    {
        return (string) (config('services.ipay88.merchant_key')
            ?? env('IPAY88_MERCHANT_KEY')
            ?? '');
    }

    private function ipay88Signature(string $refNo, string $amount, string $currency): string
    {
        $merchantKey = $this->ipay88MerchantKey();
        $merchantCode = $this->ipay88MerchantCode();

        if ($merchantKey === '' || $merchantCode === '') {
            return '';
        }

        $raw = $merchantKey . $merchantCode . $refNo . str_replace([".", ','], '', $amount) . $currency . 'Events';
        return hash_hmac('sha512', $raw, $merchantKey);
    }

    public function backend(Request $request)
    {
        $merchantCode = $request->string('MerchantCode')->toString();
        $refNo = $request->string('RefNo')->toString();
        $amount = $request->string('Amount')->toString();
        $currency = $request->string('Currency')->toString();
        $status = $request->string('Status')->toString();
        $signature = $request->string('Signature')->toString();
        $paymentDate = $request->string('TranDate');
        $issuing_bank = $request->string('S_bankname')->toString();
        $cc_name = $request->string('CCName')->toString();
        $cc_number = $request->string('CCNo')->toString();

        if ($merchantCode === '' || $refNo === '') {
            return response('INVALID', 400);
        }

        if ($merchantCode !== $this->ipay88MerchantCode()) {
            return response('INVALID', 400);
        }

        $expectedSignature = $this->ipay88Signature($refNo, $amount, $currency);
        $signatureOk = $expectedSignature !== '' && hash_equals($expectedSignature, $signature);
        if (!$signatureOk) {
            return response('INVALID', 400);
        }

        $order = Orders::query()
            ->where('order_no', $refNo)
            ->where('is_active', true)
            ->first();

        if (!$order) {
            return response('INVALID', 404);
        }

        $application = Applications::query()
            ->where('application_id', $order->application_id)
            ->first();

        if (!$application) {
            return response('INVALID', 404);
        }

        if ($status !== '1') {
            Payments::create([
                'order_id' => $order->order_id,
                'order_no' => $order->order_no,
                'payment_amount' => (float) $amount,
                'payment_date' => $paymentDate,
                'payment_status' => false,
            ]);

            return response('RECEIVEOK', 200);
        }

        DB::transaction(function () use ($order, $application, $amount, $paymentDate, $issuing_bank, $cc_name, $cc_number) {
            if (!$order->is_paid) {
                $order->update(['is_paid' => true]);
            }

            $invoice = $this->upsertInvoiceForOrder($order, $application);
            $invoice->update([
                'invoice_status' => 'paid',
            ]);

            Payments::create([
                'order_id' => $order->order_id,
                'order_no' => $order->order_no,
                'payment_amount' => (float) $amount,
                'payment_date' => $paymentDate,
                'payment_status' => true,
                'issuing_bank' => $issuing_bank,
                'cc_name' => $cc_name,
                'cc_number' => $cc_number,
            ]);
        });

        return response('RECEIVEOK', 200);
    }

    public function payment(Request $request)
    {
        $order = Orders::query()->where('order_no', $request->RefNo)->first();
        $invoice = Invoices::query()->where('order_id', $order->order_id)->first();
        $items = OrderItems::query()
            ->where('order_id', $order->order_id)
            ->orderBy('created_at')
            ->get([
                'order_item_id',
                'quantity',
                'price',
                'item_description',
            ]);
        $application = Applications::query()
            ->where('application_id', $order->application_id)
            ->first();

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        // Return a view instead of a redirect
        return Inertia::render('payments/[application_code]', [
            'application' => $application->only([
                'application_id',
                'application_code',
                'application_status',
            ]),
            'order' => $order,
            'invoice' => $invoice,
            'items' => $items,
            'ipay88' => [
                'disabled' => true,
            ],
        ]);
    }

    private function upsertInvoiceForOrder(Orders $order, Applications $application): Invoices
    {
        $invoiceAmount = (string) $order->total_price;
        $discountAmount = (string) ($order->discount_price ?? 0);

        $existing = Invoices::query()
            ->where('order_id', $order->order_id)
            ->orderByDesc('created_at')
            ->first();

        if ($existing) {
            $existing->update([
                'invoice_date' => now()->toDateString(),
                'discount_amount' => $discountAmount,
                'invoice_amount' => $invoiceAmount,
                'invoice_status' => $existing->invoice_status ?? 'pending',
            ]);
            return $existing;
        }

        $sequence = InvoiceNo::query()
            ->first();

        $current = (int) preg_replace('/\D+/', '', (string) $sequence->invoice_no);
        $next = max(0, $current) + 1;

        $sequence->update([
            'invoice_no' => (string) $next,
        ]);

        $invoiceNo = $sequence->prefix
            . str_pad((string) $next, $sequence->invoice_no_length, $sequence->invoice_no_suffix, STR_PAD_LEFT)
            . ($sequence->suffix && $sequence->suffix !== '0' ? $sequence->suffix : '');

        return Invoices::create([
            'order_id' => $order->order_id,
            'application_id' => $application->application_id,
            'invoice_no' => $invoiceNo,
            'invoice_date' => now()->toDateString(),
            'discount_amount' => $discountAmount,
            'invoice_amount' => $invoiceAmount,
            'invoice_status' => 'pending',
        ]);
    }
}
