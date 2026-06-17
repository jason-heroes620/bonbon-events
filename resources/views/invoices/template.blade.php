<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Invoice</title>
        <style>
            * { box-sizing: border-box; }
            body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; color: #111827; margin: 0; padding: 24px; }
            .muted { color: #6B7280; }
            .title { font-size: 16px; font-weight: 700; margin: 0; }
            .subtitle { font-size: 12px; margin: 2px 0 0; }
            .row { width: 100%; }
            .col { display: inline-block; vertical-align: top; }
            .col-50 { width: 49.5%; }
            .right { text-align: right; }
            .card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; }
            .section-title { font-size: 12px; font-weight: 700; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.02em; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; font-weight: 700; background: #F9FAFB; border-bottom: 1px solid #E5E7EB; padding: 8px; }
            td { border-bottom: 1px solid #E5E7EB; padding: 6px; vertical-align: top; }
            .num { text-align: right; white-space: nowrap; }
            .meta { width: 100%; }
            .meta td { border: none; padding: 1px 0; }
            .meta .label { width: 40%; color: #6B7280; }
            .totals { width: 100%; }
            .totals td { border: none; padding: 4px 0; }
            .totals .label { color: #6B7280; }
            .totals .grand { font-family: DejaVu Sans, Arial, sans-serif; font-weight: 800; font-size: 14px; }
            .spacer-8 { height: 8px; }
            .spacer-16 { height: 16px; }
            .spacer-24 { height: 24px; }
            .payment-term { margin-top: 12px; }
            .payment-term li { margin-bottom: 4px;  }
            .payment-term li::marker { color: #111827; }
            .underline { text-decoration: underline; color: #111827; }
            .bottom-ink { display: flex; justify-content: center; margin-top: 24px; }
            .bottom-ink-text { font-family: DejaVu Sans, Arial, sans-serif; font-size: 14px; font-weight: 800; color: #000000; text-align: center; }
        </style>
    </head>
    <body>
        @php
            $invoiceNo = $invoice->invoice_no ?? '-';
            $invoiceDate = $invoice->invoice_date ?? null;
            $orderNo = $order->order_no ?? '-';
            $applicationCode = $order->application_code ?? ($application->application_code ?? '-');

            $vendorName = $vendor->vendor_name ?? '-';
            $vendorReg = $vendor->business_registration_no ?? null;
            $vendorContactPerson = $vendor->vendor_contact_person ?? null;
            $vendorEmail = $vendor->vendor_email ?? null;
            $vendorPhone = $vendor->vendor_contact_no ?? null;

            $subtotal = (float) ($subtotal ?? 0);
            $discount = (float) ($discount ?? 0);
            $total = (float) ($total ?? 0);
        @endphp


        <div class="row">
            <div>
                <p class="title">ACCESSIBLE EXPERIENCES SDN BHD (1496618-A) </p>
            </div>
            <div class="col col-80">
                <p class="subtitle muted">Suite 9.01, Level 9, Menara Summit, Persiaran Kewajipan, USJ 1, UEP, 47600 Subang Jaya</p>
                <p class="subtitle muted">Mobile: +6012 745 6750   Email: hello@bonbon.com.my</p>
            </div>
        </div>
        <div class="spacer-8"></div>
        <div class="row">
            <div class="col col-50"></div>
            <div class="col col-50 right">
                <p class="title">INVOICE</p>
                <div class="spacer-8"></div>
                <table class="meta" style="margin-left: auto;">
                    <tr>
                        <td class="label">Invoice No</td>
                        <td class="num">{{ $invoiceNo }}</td>
                    </tr>
                    
                    <tr>
                        <td class="label">Order No</td>
                        <td class="num">{{ $orderNo }}</td>
                    </tr>
                    <tr>
                        <td class="label">Invoice Date</td>
                        <td class="num">{{ $invoiceDate ? \Carbon\Carbon::parse($invoiceDate)->format('d M Y') : '-' }}</td>
                    </tr>
                    <tr>
                        <td class="label">Payment Due</td>
                        <td class="num">{{ $invoiceDate ? \Carbon\Carbon::parse($invoiceDate)->format('d M Y') : '-' }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="spacer-24"></div>

        <div class="row">
            <div class="col col-50">
                <div class="card">
                    <p class="section-title">Bill To</p>
                    @if($vendorContactPerson)
                        <div class="muted">{{ $vendorContactPerson }}</div>
                    @endif
                    @if(!empty($vendor->business_name))
                        <div class="muted">{{ $vendor->business_name }}</div>
                    @endif
                    @if($vendorReg)
                        <div class="muted">{{ $vendorReg }}</div>
                    @endif
                    @if($vendorPhone)
                        <div class="muted">{{ $vendorPhone }}</div>
                    @endif
                    @if($vendorEmail)
                        <div class="muted">{{ $vendorEmail }}</div>
                    @endif
                </div>
            </div>
            <div class="col col-50">
                <div class="card">
                    <p class="section-title">Invoice Summary</p>
                    <table class="meta">
                        <tr>
                            <td class="label">Payment Status</td>
                            <td class="num">{{ $invoice->invoice_status ?? '-' }}</td>
                        </tr>
                        @if(!empty($eventName ?? null))
                            <tr>
                                <td class="label">Event</td>
                                <td class="num">{{ $eventName }}</td>
                            </tr>
                        @endif
                    </table>
                </div>
            </div>
        </div>

        <div class="spacer-24"></div>

        <div class="card">
            <p class="section-title">Items</p>
            <table>
                <thead>
                    <tr>
                        <th style="width: 52%;">Description</th>
                        <th class="num" style="width: 12%;">Qty</th>
                        <th class="num" style="width: 18%;">Unit Price (RM)</th>
                        <th class="num" style="width: 18%;">Amount (RM)</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($items ?? [] as $item)
                        @php
                            $qty = (int) ($item->quantity ?? 0);
                            $unit = (float) ($item->price ?? 0);
                            $line = $qty * $unit;
                        @endphp
                        <tr>
                            <td>{{ $item->item_description ?? '-' }}</td>
                            <td class="num">{{ $qty }}</td>
                            <td class="num">{{ number_format($unit, 2, '.', ',') }}</td>
                            <td class="num">{{ number_format($line, 2, '.', ',') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" class="muted">No items found.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>

            <div class="spacer-16"></div>

            <div class="row">
                <div class="col col-50">
                    @if(!empty($notes ?? null))
                        <div class="muted">{{ $notes }}</div>
                    @endif
                </div>
                <div class="col col-50">
                    <table class="totals" style="margin-left: auto;">
                        <tr>
                            <td class="label right">Subtotal</td>
                            <td class="num">RM {{ number_format($subtotal, 2, '.', ',') }}</td>
                        </tr>
                        @if($discount > 0)
                            <tr>
                                <td class="label right">Discount</td>
                                <td class="num">-RM{{ number_format($discount, 2, '.', ',') }}</td>
                            </tr>
                        @endif
                        @foreach(($charges ?? []) as $charge)
                            @php
                                $chargeType = (string) ($charge->charges_type ?? '');
                                $chargeRate = (float) ($charge->charges_rate ?? 0);
                                $chargeAmount = (float) ($charge->charges_amount ?? 0);
                                $chargeName = (string) ($charge->charges_name ?? 'Charge');
                            @endphp
                            <tr>
                                <td class="label right">
                                    {{ $chargeName }}@if($chargeType === 'P') ({{ rtrim(rtrim(number_format($chargeRate, 2, '.', ','), '0'), '.') }}%)@endif
                                </td>
                                <td class="num">RM {{ number_format($chargeAmount, 2, '.', ',') }}</td>
                            </tr>
                        @endforeach
                        <tr>
                            <td class="right grand">Total</td>
                            <td class="num grand">RM {{ number_format($total, 2, '.', ',') }}</td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
        <div class="spacer-24"></div>

            <div class="row">
                <p class="section-title underline">Payment Term</p>
                <div>
                        <ol class="payment-term">
                            <li>All cheques should be crossed out and made payable to <b>ACCESSIBLE EXPERIENCES SDN BHD.</b></li>
                            <li>Or you may bank into <b>CIMB 86 0546 3742 (ACCESSIBLE EXPERIENCES SDN BHD)</b> and email the bank slip to us at support@bonbon.com.my</li>
                            <li>Please notify us of any discrepancy, if any, within 3 days, otherwise this invoice will be considered correct and accepted.</li>
                            <li>Full payment for the retail display fee is due within 7 days of receiving booking confirmation. If payment is not received by the deadline,</li>    
                            <li>the Organiser reserves the right to cancel the booking and reallocate the space without further notice or liability to the Vendor.</li>
                            <li>No further changes can be made upon full payment.</li>

                </div>
            </div>

             <div class="spacer-16"></div>

             <div class="row">
                <p class="section-title underline">Event Term</p>
                <p>Upon confirmation and payment, you are to abide to the following rules and regulations</p>
                <div>
                        <ol class="event-term">
                            <li>Vendors are to abide by the operation timing stated. A valid reason is required for early closure or late opening. We will be enforcing a policy of penalizing vendors who fail to do so for 3 times consecutively. We hope that vendors take this issue seriously as the Mall's management and the organizers are really adamant about timeliness.</li>
                            <li>Please note that Vendor cancellations must be received in writing 7 working days before the event start date for a 50% refund of the retail display fee. Cancellations received within 7 working days of the event will not be eligible for a refund. In exceptional circumstances and with documented justification (e.g., hospitalisation), the Organiser may consider offering a prorated refund beyond the 7 working day window.</li>
                            <li>All items on display should tally with the information in the application form and vendors are not allowed to use the booth for any purpose other than the permitted use stated in the form.</li>
                            <li>In case of Force Majeure (including but not limited to acts of God, war, pandemic, government order, or venue closure), the Organiser reserves the right to cancel or postpone the event. <b>In such an event, the Organiser will offer the Vendor a full credit for a future event or a prorated refund based on unrecoverable costs, at the Organiser's sole discretion</b>.</li>
                            <li>Plug points are only provided upon request</li>
                            <li>Booth sharing is allowed for the “Full Even Duration Booth Choice”. Requests for sharing must be made during the application process and cannot be added last minute.</li>
                        </ol>   
                </div>
            </div>

            <div class="spacer-16"></div>
            <div class="bottom-ink">
                <p class="bottom-ink-text">THIS IS A COMPUTER-GENERATED INVOICE. NO SIGNATURE IS REQUIRED.</p>
            </div>
    </body> 
</html>
