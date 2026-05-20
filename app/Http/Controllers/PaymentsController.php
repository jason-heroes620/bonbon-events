<?php

namespace App\Http\Controllers;

use App\Models\Applications;
use App\Models\InvoiceNo;
use App\Models\Invoices;
use App\Models\OrderItems;
use App\Models\Orders;
use App\Models\Payments;
use App\Models\Vendors;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PaymentsController extends Controller
{
    private function ipay88Endpoint(): string
    {
        return (string) (config('services.ipay88.endpoint')
            ?? env('IPAY88_ENDPOINT')
            ?? 'https://sandbox.ipay88.co.id/ePayment/entry.asp');
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

    private function ipay88Currency(): string
    {
        return (string) (config('services.ipay88.currency')
            ?? env('IPAY88_CURRENCY')
            ?? 'MYR');
    }

    private function ipay88Lang(): string
    {
        return (string) (config('services.ipay88.lang')
            ?? env('IPAY88_LANG')
            ?? 'UTF-8');
    }

    private function ipay88Signature(string $refNo, string $amount, string $currency): string
    {
        $merchantKey = $this->ipay88MerchantKey();
        $merchantCode = $this->ipay88MerchantCode();

        if ($merchantKey === '' || $merchantCode === '') {
            return '';
        }

        $raw = $merchantKey . $merchantCode . $refNo . str_replace([".", ','], '', $amount) . $currency . 'Events';
        Log::info('IPAY88 Raw Signature: ' . $raw);
        return hash_hmac('sha512', $raw, $merchantKey);
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

    public function show(Request $request, string $applicationCode): Response
    {
        $application = Applications::query()
            ->where('application_code', $applicationCode)
            ->first();

        if (!$application) {
            abort(404);
        }

        $order = Orders::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
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

        $invoice = null;
        if ($order) {
            $invoice = Invoices::query()
                ->where('order_id', $order->order_id)
                ->orderByDesc('created_at')
                ->first([
                    'invoice_id',
                    'invoice_no',
                    'invoice_status',
                    'invoice_amount',
                    'invoice_date',
                ]);
        }

        $items = [];
        if ($order) {
            $items = OrderItems::query()
                ->where('order_id', $order->order_id)
                ->orderBy('created_at')
                ->get([
                    'order_item_id',
                    'quantity',
                    'price',
                    'item_description',
                ]);
        }

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
                'enabled' => $this->ipay88MerchantCode() !== '' && $this->ipay88MerchantKey() !== '',
            ],
        ]);
    }

    public function redirectToIpay88(string $applicationCode)
    {
        $application = Applications::query()
            ->where('application_code', $applicationCode)
            ->first();

        if (!$application) {
            abort(404);
        }

        $order = Orders::query()
            ->where('application_id', $application->application_id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->first();

        if (!$order) {
            throw ValidationException::withMessages([
                'order' => ['Order not found.'],
            ]);
        }

        if ($order->is_paid) {
            return redirect()->to('/payments/' . $application->application_code);
        }

        $merchantCode = $this->ipay88MerchantCode();
        $merchantKey = $this->ipay88MerchantKey();
        if ($merchantCode === '' || $merchantKey === '') {
            throw ValidationException::withMessages([
                'ipay88' => ['iPay88 is not configured.'],
            ]);
        }

        $currency = $this->ipay88Currency();

        $amount = number_format((float) $order->total_price, 2, '.', '');
        $refNo = $order->order_no;

        $responseUrl = rtrim((string) config('services.ipay88.host_url'), '/') . '/api/payments/frontend-callback';
        $backendUrl = rtrim((string) config('services.ipay88.host_url'), '/') . '/api/payments/backend-callback';

        $signature = $this->ipay88Signature($refNo, $amount, $currency);
        if ($signature === '') {
            throw ValidationException::withMessages([
                'ipay88' => ['Unable to generate signature.'],
            ]);
        }

        $vendor = Vendors::query()
            ->where('vendor_id', $application->vendor_id)
            ->first(['vendor_name', 'vendor_email', 'vendor_contact_no']);

        $prodDesc = 'BonBon Event Payment ' . $application->application_code;
        $userName = $vendor?->vendor_name ?: 'Customer';
        $userEmail = $vendor?->vendor_email ?: 'customer@example.com';
        $userContact = $vendor?->vendor_contact_no ?: '0000000000';

        $fields = [
            'MerchantCode' => $merchantCode,
            'RefNo' => $refNo,
            'Amount' => $amount,
            'Currency' => $currency,
            'ProdDesc' => $prodDesc,
            'UserName' => $userName,
            'UserEmail' => $userEmail,
            'UserContact' => $userContact,
            'Remark' => $application->application_code,
            'Signature' => $signature,
            'Xfield1' => 'Events',
            'ResponseURL' => $responseUrl,
            'BackendURL' => $backendUrl,
        ];

        $endpoint = $this->ipay88Endpoint();

        $inputs = '';
        foreach ($fields as $key => $value) {
            $k = e((string) $key);
            $v = e((string) $value);
            $inputs .= "<input type=\"hidden\" name=\"{$k}\" value=\"{$v}\">";
        }

        $html = "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Redirecting...</title></head><body>"
            . "<form id=\"ipay88\" method=\"POST\" action=\"" . e($endpoint) . "\">{$inputs}</form>"
            . "<script>document.getElementById('ipay88').submit();</script>"
            . "</body></html>";

        return response($html);
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

    public function response(Request $request)
    {
        $refNo = $request->string('RefNo')->toString();

        $order = Orders::query()
            ->where('order_no', $refNo)
            ->first();

        if (!$order) {
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
}
