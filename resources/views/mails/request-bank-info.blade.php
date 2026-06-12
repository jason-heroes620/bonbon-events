<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>BonBon - Request Bank Information</title>
        <style>
            .email-header {
                background: linear-gradient(135deg, #ea6666 0%, #a24b4b 100%);
                padding: 20px 0;
                text-align: center;
            }
            .email-footer {
                background-color: #f8f9fa;
                padding: 30px 40px;
                text-align: left;
                border-top: 1px solid #e9ecef;
            }

            .footer-text {
                font-size: 14px;
                color: #6c757d;
                margin-bottom: 10px;
            }
             .email-address {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }
        </style>
        
    </head>
    <body style="margin: 0; padding: 0; background: #f6f7fb">
         <div class="email-header">
            <img src="{{ asset('bonbon-logo.png') }}" alt="BonBon Events" width="60">
        </div>
        <div style="max-width: 640px; margin: 0 auto; padding: 24px">
            <div
                style="
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 20px;
                "
            >
                <div style="font-size: 18px; font-weight: 700; color: #111827">
                    BonBon - Request Bank Information
                </div>

                <div style="margin-top: 12px; font-size: 14px; color: #374151">
                    Hi {{ $vendorName }},
                </div>

                <div style="margin-top: 10px; font-size: 14px; color: #374151">
                    Thank you for participating in our recent event. We appreciate your support and hope you enjoyed the experience. 
                </div>
                <div style="margin-top: 10px; font-size: 14px; color: #374151">
                    We are preparing your deposit refund for application
                    @if (count($applicationCodes ?? []) === 1)
                        <span style="font-weight: 700">{{ $applicationCodes[0] }}</span>.
                    @else
                        the following applications:
                        <ul style="margin: 8px 0 0 18px; padding: 0; color: #111827">
                            @foreach (($applicationCodes ?? []) as $code)
                                <li style="margin: 2px 0">{{ $code }}</li>
                            @endforeach
                        </ul>
                    @endif
                    Please provide your bank information below:
                </div>

                <div
                    style="
                        margin-top: 14px;
                        padding: 12px;
                        background: #f9fafb;
                        border: 1px solid #e5e7eb;
                        border-radius: 10px;
                        font-size: 14px;
                        color: #111827;
                    "
                >
                    <div><strong>Bank Name:</strong></div>
                    <div style="margin-top: 8px">
                        <strong>Bank Account Name:</strong>
                    </div>
                    <div style="margin-top: 8px">
                        <strong>Bank Account Number:</strong>
                    </div>
                </div>

                <div style="margin-top: 14px; font-size: 14px; color: #374151">
                    You may reply to this email with the details above or simply login at our BonBon events <a href="{{ route('home') }}">home page</a> and update your bank information in your account profile page.
                </div>
                <div style="margin-top: 14px; font-size: 14px; color: #374151">
                    Let us know if you have any questions or need any assistance.
                </div>

                <div
                    style="
                        margin-top: 18px;
                        border-top: 1px solid #e5e7eb;
                        padding-top: 14px;
                        font-size: 14px;
                        color: #6b7280;
                    "
                >
                    Thank you.
                </div>
            </div>

            <div class="email-footer">
            <span class="footer-text">Sincerely,</span><br>
            <span class="footer-text">BonBon Event Team</span>
            <p></p>
            <div class="email-address">
                <div>
                    <span class="footer-text">Contact No.:</span><br>
                    <span class="footer-text">012 7456 750</span>
                </div>

                <div>
                    <span class="footer-text">Address:</span><br>
                    <span class="footer-text">Suite 9.01, Menara Summit</span><br>
                    <span class="footer-text">Persiaran Kewajipan, USJ 1,</span><br>
                    <span class="footer-text">UEP, 47600 Subang Jaya,</span><br>
                    <span class="footer-text">Selangor</span><br>
                </div>
            </div>
        </div>
        </div>
        
    </body>
</html>
