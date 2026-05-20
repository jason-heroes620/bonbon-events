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
use Illuminate\Support\Facades\Log;
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
        try {
            $merchantCode = $request->string('MerchantCode')->toString();
            $refNo = $request->string('RefNo')->toString();
            $amountRaw = $request->string('Amount')->toString();
            $currency = $request->string('Currency')->toString();
            $status = $request->string('Status')->toString();
            $signature = $request->string('Signature')->toString();
            $paymentDate = $request->string('TranDate')->toString();
            $transactionId = $request->string('TransId')->toString();
            $issuingBank = $request->string('S_bankname')->toString();
            $ccName = $request->string('CCName')->toString();
            $ccNumber = $request->string('CCNo')->toString();

            $amount = (string) preg_replace('/[^\d.,]/', '', $amountRaw);
            $paymentAmount = (float) str_replace(',', '', $amount);
            $paymentDateValue = $paymentDate !== '' ? $paymentDate : now()->toDateTimeString();

            Log::info('ipay88.backend.receive', [
                'merchant_code' => $merchantCode,
                'ref_no' => $refNo,
                'amount' => $amount,
                'currency' => $currency,
                'status' => $status,
                'signature_len' => strlen($signature),
                'transaction_id' => $transactionId,
                'payment_date' => $paymentDate,
                'issuing_bank' => $issuingBank,
                'cc_last4' => $ccNumber !== '' ? substr($ccNumber, -4) : null,
            ]);

            if ($merchantCode === '' || $refNo === '') {
                Log::warning('ipay88.backend.invalid_request', [
                    'merchant_code' => $merchantCode,
                    'ref_no' => $refNo,
                ]);
                return response('INVALID', 400);
            }

            if ($merchantCode !== $this->ipay88MerchantCode()) {
                Log::warning('ipay88.backend.merchant_mismatch', [
                    'merchant_code' => $merchantCode,
                ]);
                return response('INVALID', 400);
            }

            $expectedSignature = $this->ipay88Signature($refNo, $amount, $currency);
            $signatureOk = $expectedSignature !== '' && hash_equals($expectedSignature, $signature);
            if (!$signatureOk && !env('IPAY88_SKIP_SIGNATURE_VERIFY', false)) {
                Log::warning('ipay88.backend.signature_mismatch', [
                    'ref_no' => $refNo,
                    'expected_len' => strlen($expectedSignature),
                    'received_len' => strlen($signature),
                ]);
                return response('INVALID', 400);
            }

            $order = Orders::query()
                ->where('order_no', $refNo)
                ->where('is_active', true)
                ->first();

            if (!$order) {
                Log::warning('ipay88.backend.order_not_found', [
                    'ref_no' => $refNo,
                ]);
                return response('INVALID', 404);
            }

            $application = Applications::query()
                ->where('application_id', $order->application_id)
                ->first();

            if (!$application) {
                Log::warning('ipay88.backend.application_not_found', [
                    'order_id' => $order->order_id,
                    'application_id' => $order->application_id,
                ]);
                return response('INVALID', 404);
            }

            if ($status !== '1') {
                Payments::create([
                    'order_id' => $order->order_id,
                    'order_no' => $order->order_no,
                    'transaction_id' => $transactionId !== '' ? $transactionId : $order->order_no,
                    'payment_amount' => $paymentAmount,
                    'payment_date' => $paymentDateValue,
                    'issuing_bank' => $issuingBank !== '' ? $issuingBank : null,
                    'cc_name' => $ccName !== '' ? $ccName : null,
                    'cc_number' => $ccNumber !== '' ? $ccNumber : null,
                    'payment_status' => 0,
                ]);

                return response('RECEIVEOK', 200);
            }

            DB::transaction(function () use ($order, $application, $paymentAmount, $paymentDateValue, $issuingBank, $ccName, $ccNumber, $transactionId) {
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
                    'transaction_id' => $transactionId !== '' ? $transactionId : $order->order_no,
                    'payment_amount' => $paymentAmount,
                    'payment_date' => $paymentDateValue,
                    'issuing_bank' => $issuingBank !== '' ? $issuingBank : null,
                    'cc_name' => $ccName !== '' ? $ccName : null,
                    'cc_number' => $ccNumber !== '' ? $ccNumber : null,
                    'payment_status' => 1,
                ]);
            });

            return response('RECEIVEOK', 200);
        } catch (\Throwable $e) {
            Log::error('ipay88.backend.exception', [
                'message' => $e->getMessage(),
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => collect($e->getTrace())->take(8)->all(),
            ]);

            return response('INVALID', 500);
        }
    }

    public function payment(Request $request, string $refNo)
    {
        $order = Orders::query()->where('order_no', $refNo)->first();
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

        $year = (string) now()->year;
        $sequence = InvoiceNo::query()
            ->where('invoice_year', $year)
            ->lockForUpdate()
            ->orderByDesc('created_at')
            ->first();

        if (!$sequence) {
            $sequence = InvoiceNo::create([
                'invoice_year' => $year,
                'prefix' => 'INV',
                'invoice_no' => '0',
                'suffix' => '0',
            ]);
        }

        $current = (int) preg_replace('/\D+/', '', (string) $sequence->invoice_no);
        $next = max(0, $current) + 1;

        $sequence->update([
            'invoice_no' => (string) $next,
        ]);

        $invoiceNo = $sequence->prefix
            . str_pad((string) $next, 8, '0', STR_PAD_LEFT)
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
