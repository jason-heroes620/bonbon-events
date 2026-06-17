<?php

namespace App\Services;

use App\Jobs\GenerateInvoicePdf;
use App\Models\Applications;
use App\Models\InvoiceCharges;
use App\Models\InvoiceNo;
use App\Models\Invoices;
use App\Models\OrderCharges;
use App\Models\Orders;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InvoiceService
{
    public function upsertInvoiceForOrder(Orders $order, Applications $application): Invoices
    {
        $invoiceAmount = (string) $order->total_price;
        $subTotal = (string) ($order->sub_total ?? 0);
        $discountAmount = (string) ($order->discount_price ?? 0);
        $chargesTotal = (string) ($order->charges_total ?? 0);

        $existing = Invoices::query()
            ->where('order_id', $order->order_id)
            ->orderByDesc('created_at')
            ->first();

        if ($existing) {
            $existing->update([
                'invoice_date' => now()->toDateString(),
                'sub_total' => $subTotal,
                'discount_amount' => $discountAmount,
                'charges_total' => $chargesTotal,
                'invoice_amount' => $invoiceAmount,
                'invoice_status' => $existing->invoice_status ?? ($order->is_paid ? 'paid' : 'pending'),
            ]);

            $this->syncInvoiceChargesFromOrder($existing, $order);
            GenerateInvoicePdf::dispatch($existing, $order);
            return $existing;
        }

        return DB::transaction(function () use ($order, $application, $invoiceAmount, $subTotal, $discountAmount, $chargesTotal) {
            $existingInTx = Invoices::query()
                ->where('order_id', $order->order_id)
                ->orderByDesc('created_at')
                ->lockForUpdate()
                ->first();

            if ($existingInTx) {
                $existingInTx->update([
                    'invoice_date' => now()->toDateString(),
                    'sub_total' => $subTotal,
                    'discount_amount' => $discountAmount,
                    'charges_total' => $chargesTotal,
                    'invoice_amount' => $invoiceAmount,
                    'invoice_status' => $existingInTx->invoice_status ?? ($order->is_paid ? 'paid' : 'pending'),
                ]);

                $this->syncInvoiceChargesFromOrder($existingInTx, $order);
                GenerateInvoicePdf::dispatch($existingInTx, $order);
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
                'sub_total' => $subTotal,
                'discount_amount' => $discountAmount,
                'charges_total' => $chargesTotal,
                'invoice_amount' => $invoiceAmount,
                'invoice_status' => $order->is_paid ? 'paid' : 'pending',
            ]);
            $this->syncInvoiceChargesFromOrder($invoice, $order);
            // create a job invoice pdf
            GenerateInvoicePdf::dispatch($invoice, $order);

            return $invoice;
        });
    }

    private function syncInvoiceChargesFromOrder(Invoices $invoice, Orders $order): void
    {
        $orderCharges = OrderCharges::query()
            ->where('order_id', $order->order_id)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get([
                'charges_id',
                'charges_name',
                'charges_type',
                'charges_rate',
                'charges_amount',
                'sort_order',
            ]);

        InvoiceCharges::query()
            ->where('invoice_id', $invoice->invoice_id)
            ->delete();

        foreach ($orderCharges as $row) {
            InvoiceCharges::create([
                'invoice_id' => $invoice->invoice_id,
                'charges_id' => $row->charges_id,
                'charges_name' => (string) $row->charges_name,
                'charges_type' => (string) $row->charges_type,
                'charges_rate' => (string) $row->charges_rate,
                'charges_amount' => (string) $row->charges_amount,
                'sort_order' => (int) ($row->sort_order ?? 1),
            ]);
        }
    }
}
