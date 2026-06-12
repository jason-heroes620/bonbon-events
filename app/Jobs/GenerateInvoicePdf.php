<?php

namespace App\Jobs;

use App\Models\Invoices;
use App\Models\OrderItems;
use App\Models\Orders;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class GenerateInvoicePdf implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Invoices $invoice,
        public Orders $order
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $order = Orders::query()
            ->with(['application.vendor', 'application.events.event'])
            ->where('order_id', $this->order->order_id)
            ->first() ?? $this->order;

        $invoice = Invoices::query()
            ->where('invoice_id', $this->invoice->invoice_id)
            ->first() ?? $this->invoice;

        $items = OrderItems::query()
            ->where('order_id', $order->order_id)
            ->where('is_active', true)
            ->orderBy('created_at')
            ->get([
                'order_item_id',
                'quantity',
                'price',
                'item_description',
            ]);

        $subtotal = (float) $items->sum(fn($item) => (float) $item->price * (int) $item->quantity);
        $discount = (float) ($invoice->discount_amount ?? $order->discount_price ?? 0);
        $total = (float) ($invoice->invoice_amount ?? $order->total_price ?? max(0, $subtotal - $discount));

        $application = $order->application;
        $vendor = $application?->vendor;
        $eventName = $application?->events
            ?->map(fn($ae) => $ae->event?->event_name)
            ->filter()
            ->values()
            ->join(', ');

        $pdf = Pdf::loadView('invoices.template', [
            'order' => $order,
            'invoice' => $invoice,
            'application' => $application,
            'vendor' => $vendor,
            'items' => $items,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
            'eventName' => $eventName,
            'companyName' => (string) config('app.name', 'BonBon'),
        ]);

        $fileName = 'invoices/invoice_' . $invoice->invoice_no . '_' . time() . '.pdf';

        Storage::disk('local')->put($fileName, $pdf->output());

        $invoice->update([
            'invoice_file' => $fileName,
        ]);
    }
}
