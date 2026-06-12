<?php

namespace App\Mail;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicationPaymentReminderEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $applicationCode,
        public string $vendorName,
        public string $orderNo,
        public string $orderDate,
        public string $amount,
    ) {}

    public function build(): self
    {
        return $this->subject("Payment Reminder - {$this->orderNo}")
            ->view('mails.payment-reminder', [
                'applicationCode' => $this->applicationCode,
                'vendorName' => $this->vendorName,
                'orderNo' => $this->orderNo,
                'orderDate' => Carbon::parse($this->orderDate)->format('d M, y'),
                'amount' => $this->amount,
            ]);
    }
}
