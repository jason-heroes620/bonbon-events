<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class InvoiceRequestedEmail extends Mailable
{
    public function __construct(
        public string $vendorName,
        public string $applicationCode,
        public string $invoiceNo,
        public string $amount,
        public string $pdfData,
        public string $fileName,
    ) {}

    public function build(): self
    {
        return $this->subject("Invoice {$this->invoiceNo} - {$this->applicationCode}")
            ->view('mails.invoice-requested', [
                'vendorName' => $this->vendorName,
                'applicationCode' => $this->applicationCode,
                'invoiceNo' => $this->invoiceNo,
                'amount' => $this->amount,
            ])
            ->attachData($this->pdfData, $this->fileName, [
                'mime' => 'application/pdf',
            ]);
    }
}
