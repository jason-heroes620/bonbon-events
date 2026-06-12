<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RequestVendorBankInfoEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $vendorName,
        /** @var array<int, string> */
        public array $applicationCodes,
    ) {}

    public function build(): self
    {
        $subject = count($this->applicationCodes) === 1
            ? "Request Bank Information - {$this->applicationCodes[0]}"
            : 'Request Bank Information - Multiple Applications';

        return $this->subject($subject)
            ->view('mails.request-bank-info', [
                'vendorName' => $this->vendorName,
                'applicationCodes' => $this->applicationCodes,
            ]);
    }
}
