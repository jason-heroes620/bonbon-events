<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\EnsurePaidInvoiceGenerated;
use App\Models\ApplicationBooths;
use App\Models\Applications;
use App\Models\EventBooths;
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
    private function normalizeRefNo(string $refNo): string
    {
        return str_starts_with($refNo, 'TEST-')
            ? substr($refNo, 5)
            : $refNo;
    }

    private function isDummyRefNo(string $refNo): bool
    {
        return str_starts_with($refNo, 'TEST-');
    }

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
            $lookupRefNo = $this->normalizeRefNo($refNo);
            $isDummy = $this->isDummyRefNo($refNo);
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

            $order = Orders::query()
                ->where('order_no', $lookupRefNo)
                ->where('is_active', true)
                ->first();

            if (!$order) {
                if ($isDummy) {
                    Log::info('ipay88.backend.dummy_orderless', [
                        'ref_no' => $refNo,
                        'amount' => $paymentAmount,
                        'status' => $status,
                    ]);

                    return response('RECEIVEOK', 200);
                }

                Log::warning('ipay88.backend.order_not_found', [
                    'ref_no' => $refNo,
                    'lookup_ref_no' => $lookupRefNo,
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
                if ($isDummy) {
                    Log::info('ipay88.backend.dummy_failed', [
                        'ref_no' => $refNo,
                        'order_no' => $order->order_no,
                        'status' => $status,
                        'amount' => $paymentAmount,
                    ]);

                    return response('RECEIVEOK', 200);
                }

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

            if ($isDummy) {
                Log::info('ipay88.backend.dummy_success', [
                    'ref_no' => $refNo,
                    'order_no' => $order->order_no,
                    'amount' => $paymentAmount,
                ]);

                return response('RECEIVEOK', 200);
            }

            DB::transaction(function () use ($order, $paymentAmount, $paymentDateValue, $issuingBank, $ccName, $ccNumber, $transactionId) {
                if (!$order->is_paid) {
                    $order->update(['is_paid' => true]);
                }

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

            EnsurePaidInvoiceGenerated::dispatch(
                orderId: $order->order_id,
                applicationId: $application->application_id,
            )->afterResponse();

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

    public function frontendCallback(Request $request)
    {
        $refNo = $request->string('RefNo')->toString();
        $lookupRefNo = $this->normalizeRefNo($refNo);

        $order = Orders::query()
            ->where('order_no', $lookupRefNo)
            ->first();

        if (!$order) {
            if ($this->isDummyRefNo($refNo)) {
                return response(
                    "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Dummy Payment Complete</title></head><body style=\"font-family: Arial, sans-serif; padding: 24px;\"><h1>Dummy payment callback received</h1><p>Reference: "
                        . e($refNo)
                        . "</p><p>Test amount limited to RM 1.00.</p></body></html>"
                );
            }

            return redirect('/');
        }

        $application = Applications::query()
            ->where('application_id', $order->application_id)
            ->first();

        if (!$application) {
            return redirect('/');
        }

        return redirect()->to('/payments/' . $application->application_code);
    }

    public function payment(Request $request, string $refNo)
    {
        $lookupRefNo = $this->normalizeRefNo($refNo);
        $order = Orders::query()->where('order_no', $lookupRefNo)->first();
        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        Log::info($order);
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
}
