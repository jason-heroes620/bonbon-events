<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice Requested</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f6f9fc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }

        .email-container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
        }

        .email-header {
            background: linear-gradient(135deg, #ea6666 0%, #a24b4b 100%);
            padding: 20px 0;
            text-align: center;
        }

        .email-body {
            padding: 40px;
            text-align: left;
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

        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
        }

        .summary-table th,
        .summary-table td {
            padding: 12px 14px;
            border: 1px solid #e5e7eb;
            text-align: left;
        }

        .summary-table th {
            width: 160px;
            background-color: #f3f4f6;
        }

        .email-address {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 30px 20px;
            }

            .email-footer {
                padding: 20px;
            }

            .email-address {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <img src="{{ asset('bonbon-logo.png') }}" alt="BonBon Events" width="60">
        </div>

        <div class="email-body">
            <p>Hi {{ $vendorName }},</p>

            <p>Please find your invoice attached.</p>

            <table class="summary-table" role="presentation">
                <tr>
                    <th>Application Code</th>
                    <td>{{ $applicationCode }}</td>
                </tr>
                <tr>
                    <th>Invoice No</th>
                    <td>{{ $invoiceNo }}</td>
                </tr>
                <tr>
                    <th>Amount</th>
                    <td>RM {{ $amount }}</td>
                </tr>
            </table>

            <p>If you have any questions, please contact our team.</p>
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
