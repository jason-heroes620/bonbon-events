<?php

namespace App\Mail;

use App\Models\Applications;
use App\Models\Events;
use App\Models\Vendors;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ApplicationRejectedEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $applicationCode,
        public string $vendorContactPerson,
        public string $eventName,
    ) {}

    public function build(): self
    {
        Log::info('in rejected mail');
        return $this->subject("Application Rejected - {$this->applicationCode}")
            ->view('mails.application-rejected', [
                'applicationCode' => $this->applicationCode,
                'userName' => $this->vendorContactPerson,
                'eventName' => $this->eventName,
            ]);
    }
}
