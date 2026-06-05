<?php

namespace App\Services;

use App\Jobs\GenerateInvoicePdf;
use App\Models\Applications;
use App\Models\InvoiceNo;
use App\Models\Invoices;
use App\Models\Orders;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InvoiceService
{
    public function upsertInvoiceForOrder(Orders $order, Applications $application): Invoices
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

        return DB::transaction(function () use ($order, $application, $invoiceAmount, $discountAmount) {
            $existingInTx = Invoices::query()
                ->where('order_id', $order->order_id)
                ->orderByDesc('created_at')
                ->lockForUpdate()
                ->first();

            if ($existingInTx) {
                $existingInTx->update([
                    'invoice_date' => now()->toDateString(),
                    'discount_amount' => $discountAmount,
                    'invoice_amount' => $invoiceAmount,
                    'invoice_status' => $existingInTx->invoice_status ?? 'pending',
                ]);

                return $existingInTx;
            }

            $sequence = InvoiceNo::query()
                ->lockForUpdate()
                ->first();

            if (!$sequence) {
                throw new RuntimeException('Invoice number sequence is not configured.');
            }

            $current = (int) preg_replace('/\D+/', '', (string) $sequence->invoice_no);
            $next = max(0, $current) + 1;

            $sequence->update([
                'invoice_no' => (string) $next,
            ]);

            $padLength = (int) ($sequence->length ?? 8);
            $suffix = (string) ($sequence->suffix ?? '');

            $invoiceNo = (string) ($sequence->prefix ?? '')
                . str_pad((string) $next, max(1, $padLength), $suffix ?? '0', STR_PAD_LEFT);

            $invoice = Invoices::create([
                'order_id' => $order->order_id,
                'application_id' => $application->application_id,
                'invoice_no' => $invoiceNo,
                'invoice_date' => now()->toDateString(),
                'discount_amount' => $discountAmount,
                'invoice_amount' => $invoiceAmount,
                'invoice_status' => $order->order_status ?? 'pending',
            ]);
            // create a job invoice pdf
            GenerateInvoicePdf::dispatch($invoice, $order);

            return $invoice;
        });
    }
}
