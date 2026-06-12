<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicationApprovedPaymentLink extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $applicationCode,
        public string $paymentUrl,
        public string $userName,
        public string $eventName,
    ) {}

    public function build(): self
    {
        return $this->subject("Application Approved - {$this->applicationCode}")
            ->view('mails.application-approve', [
                'applicationCode' => $this->applicationCode,
                'paymentUrl' => $this->paymentUrl,
                'userName' => $this->userName,
                'eventName' => $this->eventName,
            ]);
    }
}
