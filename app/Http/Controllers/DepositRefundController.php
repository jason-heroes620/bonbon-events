<?php

namespace App\Http\Controllers;

use App\Mail\RequestVendorBankInfoEmail;
use App\Models\ApplicationEvent;
use App\Models\Applications;
use App\Models\DepositRefunds;
use App\Models\Deposits;
use App\Models\EventDeposits;
use App\Models\Events;
use App\Models\Orders;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Response as ResponseFacade;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DepositRefundController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedEventId = $request->string('event_id')->toString();

        $events = Events::query()
            ->orderBy('event_start_date', 'asc')
            ->orderBy('event_name', 'asc')
            ->get([
                'event_id',
                'event_name',
                'event_start_date',
            ]);

        $applications = collect();

        $depositAmount = $this->getDepositAmountForEvent($selectedEventId);

        if ($selectedEventId !== '') {
            $applications = $this->getApprovedApplicationsForRefund($selectedEventId, $depositAmount);
        }

        return Inertia::render('finance/deposit-refund', [
            'events' => $events,
            'selectedEventId' => $selectedEventId !== '' ? $selectedEventId : null,
            'depositAmount' => $depositAmount,
            'applications' => $applications,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'application_code' => ['required', 'string', 'exists:applications,application_code'],
            'refund_status' => ['required', 'in:refunded,forfeited,pending'],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
            'refund_date' => ['nullable', 'date'],
            'refund_file' => ['nullable', 'file', 'max:5120'],
            'refund_comment' => ['nullable', 'string'],
        ]);

        $status = (string) $validated['refund_status'];
        $description = trim((string) ($validated['refund_comment'] ?? ''));

        if ($description === '') {
            throw ValidationException::withMessages([
                'refund_comment' => ['Refund description is required.'],
            ]);
        }

        if ($status !== 'forfeited') {
            if (!isset($validated['refund_amount']) || $validated['refund_amount'] === null || $validated['refund_amount'] === '') {
                throw ValidationException::withMessages([
                    'refund_amount' => ['Refund amount is required unless status is forfeited.'],
                ]);
            }

            if (empty($validated['refund_date'])) {
                throw ValidationException::withMessages([
                    'refund_date' => ['Refund date is required unless status is forfeited.'],
                ]);
            }

            if (!$request->hasFile('refund_file')) {
                throw ValidationException::withMessages([
                    'refund_file' => ['Refund file is required unless status is forfeited.'],
                ]);
            }
        }

        $refund = DepositRefunds::query()
            ->where('application_code', $validated['application_code'])
            ->orderByDesc('created_at')
            ->first();

        $refundFile = $refund?->refund_file;
        if ($request->hasFile('refund_file')) {
            $path = $request->file('refund_file')->storePublicly('deposit_refunds', 'public');
            $refundFile = "/storage/{$path}";
        }

        $payload = [
            'application_code' => $validated['application_code'],
            'refund_status' => $status,
            'refund_amount' => $status === 'forfeited'
                ? 0
                : (string) $validated['refund_amount'],
            'refund_date' => $status === 'forfeited'
                ? null
                : (string) $validated['refund_date'],
            'refund_file' => $refundFile,
            'refund_comment' => $description,
        ];

        if ($refund) {
            $refund->update($payload);
        } else {
            DepositRefunds::create($payload);
        }

        return redirect()->back();
    }

    public function requestBankInfo(Request $request)
    {
        $applicationCodes = $request->input('application_codes');
        if (is_array($applicationCodes)) {
            $validated = $request->validate([
                'application_codes' => ['required', 'array', 'min:1'],
                'application_codes.*' => ['required', 'string', 'exists:applications,application_code'],
            ]);
            $codes = array_values(array_unique(array_filter($validated['application_codes'])));
        } else {
            $validated = $request->validate([
                'application_code' => ['required', 'string', 'exists:applications,application_code'],
            ]);
            $codes = [(string) $validated['application_code']];
        }

        $applications = Applications::query()
            ->with(['vendor'])
            ->whereIn('application_code', $codes, 'and', false)
            ->get();

        if ($applications->isEmpty()) {
            throw ValidationException::withMessages([
                'application_code' => ['Application not found.'],
            ]);
        }

        $groups = [];
        foreach ($applications as $application) {
            $vendor = $application->vendor;
            $email = trim((string) ($vendor?->vendor_email ?? ''));
            if ($email === '') {
                throw ValidationException::withMessages([
                    'vendor' => ['Vendor email not found.'],
                ]);
            }

            $key = mb_strtolower($email);
            if (!isset($groups[$key])) {
                $groups[$key] = [
                    'email' => $email,
                    'vendorName' => $vendor?->vendor_name ?: 'Vendor',
                    'applicationCodes' => [],
                ];
            }

            $groups[$key]['applicationCodes'][] = (string) $application->application_code;
        }

        foreach ($groups as $group) {
            Mail::to($group['email'])->queue(new RequestVendorBankInfoEmail(
                vendorName: (string) $group['vendorName'],
                applicationCodes: array_values(array_unique($group['applicationCodes'])),
            ));
        }

        return redirect()->back();
    }

    public function previewRequestBankInfo(string $applicationCode)
    {
        $application = Applications::query()
            ->with(['vendor'])
            ->where('application_code', $applicationCode)
            ->first();

        $vendor = $application?->vendor;
        if (!$application || !$vendor) {
            abort(404);
        }

        return view('mails.request-bank-info', [
            'vendorName' => $vendor->vendor_name ?: 'Vendor',
            'applicationCodes' => [$application->application_code],
        ]);
    }

    public function export(Request $request)
    {
        $eventId = $request->string('event_id')->toString();

        if ($eventId === '') {
            abort(404);
        }

        $event = Events::query()
            ->where('event_id', $eventId)
            ->first([
                'event_id',
                'event_name',
                'event_start_date',
            ]);

        if (!$event) {
            abort(404);
        }

        $depositAmount = $this->getDepositAmountForEvent($eventId);
        $rows = $this->getApprovedApplicationsForRefund($eventId, $depositAmount);

        $safeEventName = preg_replace('/[^A-Za-z0-9_-]+/', '_', (string) $event->event_name) ?: 'event';
        $fileName = 'deposit_refund_' . $safeEventName . '_' . now()->format('Ymd_His') . '.csv';

        return ResponseFacade::streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }

            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, [
                'Application Code',
                'Vendor Name',
                'Payment Status',
                'Payment Amount',
                'Bank Name',
                'Bank Account Name',
                'Bank Account No',
            ]);

            foreach ($rows as $row) {
                $isPaid = (bool) ($row['is_paid'] ?? false);
                $amount = (float) ($row['payment_amount'] ?? 0);

                fputcsv($out, [
                    (string) ($row['application_code'] ?? ''),
                    (string) ($row['vendor_name'] ?? ''),
                    $isPaid ? 'PAID' : 'UNPAID',
                    number_format($amount, 2, '.', ''),
                    (string) ($row['vendor_bank_name'] ?? ''),
                    (string) ($row['vendor_bank_account_name'] ?? ''),
                    (string) ($row['vendor_bank_account_no'] ?? ''),
                ]);
            }

            fclose($out);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function getDepositAmountForEvent(string $eventId): float
    {
        if ($eventId === '') {
            return 0.0;
        }

        $event = Events::query()
            ->where('event_id', $eventId)
            ->first(['event_id', 'require_deposit']);

        if (!$event || !$event->require_deposit) {
            return 0.0;
        }

        $depositId = EventDeposits::query()
            ->where('event_id', $eventId)
            ->where('event_deposit_status', 'active')
            ->orderByDesc('created_at')
            ->value('deposit_id');

        if (!$depositId) {
            return 0.0;
        }

        return (float) (Deposits::query()
            ->where('deposit_id', $depositId)
            ->value('deposit_amount') ?? 0);
    }

    private function getApprovedApplicationsForRefund(string $eventId, float $depositAmount)
    {
        $rows = ApplicationEvent::query()
            ->leftJoin('applications', 'application_events.application_id', '=', 'applications.application_id')
            ->leftJoin('vendors', 'applications.vendor_id', '=', 'vendors.vendor_id')
            ->leftJoin('orders', function ($join) {
                $join->on('applications.application_id', '=', 'orders.application_id')
                    ->where('orders.is_active', true);
            })
            ->where('application_events.event_id', $eventId)
            ->where('application_events.application_status', 'approved')
            ->where('orders.is_paid', true)
            ->orderByDesc('application_events.created_at')
            ->get([
                'application_events.application_event_id',
                'applications.application_id',
                'applications.application_code',
                'applications.vendor_id',
                'application_events.event_id',
                'vendors.vendor_name',
                'vendors.vendor_email',
                'vendors.vendor_bank_name',
                'vendors.vendor_bank_account_name',
                'vendors.vendor_bank_account_no',
                'orders.order_id',
                'orders.is_paid',
            ])
            ->values();

        $refundsByApplicationCode = DepositRefunds::query()
            ->whereIn('application_code', $rows->pluck('application_code')->filter()->unique()->values()->all(), 'and', false)
            ->orderByDesc('created_at')
            ->get([
                'application_code',
                'refund_status',
                'refund_amount',
                'refund_date',
                'refund_file',
                'refund_comment',
                'created_at',
            ])
            ->unique('application_code')
            ->keyBy('application_code');

        return $rows->map(function ($row) use ($depositAmount, $refundsByApplicationCode) {
            $isPaid = (bool) ($row->is_paid ?? false);
            $refund = $refundsByApplicationCode->get((string) $row->application_code);

            $event = Events::query()
                ->where('event_id', $row->event_id)
                ->select('event_name')
                ->first();

            $deposit = Orders::query()
                ->leftJoin('order_items', 'orders.order_id', '=', 'order_items.order_id')
                ->where('application_code', $row->application_code)
                ->where('order_items.item_description', 'like', "Deposit - %{$event->event_name}%")
                ->select('order_items.price')
                ->first()
                ->price;

            if (!$deposit) {
                $deposit = 0.0;
            }

            return [
                'application_id' => $row->application_id,
                'application_event_id' => $row->application_event_id,
                'application_code' => $row->application_code,
                'vendor_id' => $row->vendor_id,
                'vendor_name' => $row->vendor_name,
                'vendor_email' => $row->vendor_email,
                'order_id' => $row->order_id,
                'is_paid' => $isPaid,
                'payment_amount' => $isPaid ? $deposit : $depositAmount,
                'vendor_bank_name' => $row->vendor_bank_name,
                'vendor_bank_account_name' => $row->vendor_bank_account_name,
                'vendor_bank_account_no' => $row->vendor_bank_account_no,
                'refund_status' => $refund?->refund_status,
                'refund_amount' => $refund?->refund_amount,
                'refund_date' => $refund?->refund_date,
                'refund_file' => $refund?->refund_file,
                'refund_comment' => $refund?->refund_comment,
            ];
        });
    }
}
