<?php

namespace App\Jobs;

use App\Models\Applications;
use App\Models\Orders;
use App\Services\InvoiceService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class EnsurePaidInvoiceGenerated implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $orderId,
        public string $applicationId,
    ) {}

    public function handle(InvoiceService $invoiceService): void
    {
        $order = Orders::query()->where('order_id', $this->orderId)->first();
        $application = Applications::query()
            ->where('application_id', $this->applicationId)
            ->first();

        if (!$order || !$application) {
            Log::warning('invoice.ensure_paid_invoice.missing_model', [
                'order_id' => $this->orderId,
                'application_id' => $this->applicationId,
            ]);
            return;
        }

        $invoice = $invoiceService->upsertInvoiceForOrder($order, $application);
        $invoice->update([
            'invoice_status' => 'paid',
        ]);

        GenerateInvoicePdf::dispatch($invoice, $order);
    }
}
