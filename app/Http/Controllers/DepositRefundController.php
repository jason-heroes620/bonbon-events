<?php

namespace App\Http\Controllers;

use App\Models\Applications;
use App\Models\Deposits;
use App\Models\EventDeposits;
use App\Models\Events;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response as ResponseFacade;
use Inertia\Inertia;
use Inertia\Response;

class DepositRefundController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedEventId = $request->string('event_id')->toString();

        $events = Events::query()
            ->orderBy('event_start_date', 'desc')
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
        return Applications::query()
            ->leftJoin('vendors', 'applications.vendor_id', '=', 'vendors.vendor_id')
            ->leftJoin('orders', function ($join) {
                $join->on('applications.application_id', '=', 'orders.application_id')
                    ->where('orders.is_active', true);
            })
            ->where('applications.event_id', $eventId)
            ->where('applications.application_status', 'approved')
            ->orderByDesc('applications.created_at')
            ->get([
                'applications.application_id',
                'applications.application_code',
                'applications.vendor_id',
                'vendors.vendor_name',
                'vendors.vendor_bank_name',
                'vendors.vendor_bank_account_name',
                'vendors.vendor_bank_account_no',
                'orders.order_id',
                'orders.is_paid',
            ])
            ->map(function ($row) use ($depositAmount) {
                $isPaid = (bool) ($row->is_paid ?? false);

                return [
                    'application_id' => $row->application_id,
                    'application_code' => $row->application_code,
                    'vendor_id' => $row->vendor_id,
                    'vendor_name' => $row->vendor_name,
                    'order_id' => $row->order_id,
                    'is_paid' => $isPaid,
                    'payment_amount' => $isPaid ? $depositAmount : 0.0,
                    'vendor_bank_name' => $row->vendor_bank_name,
                    'vendor_bank_account_name' => $row->vendor_bank_account_name,
                    'vendor_bank_account_no' => $row->vendor_bank_account_no,
                ];
            });
    }
}
