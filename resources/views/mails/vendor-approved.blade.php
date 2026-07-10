<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Reminder</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f6f9fc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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

        .login-button-container {
            text-align: center;
        }

        .login-button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
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
            width: 140px;
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
            <p>Hi {{ $vendor->vendor_contact_person }},</p>

            <p>We are pleased to inform you that your application to join our platform as a vendor has been approved. Your account is now active, and you may begin using our platform. Welcome aboard, and we look forward to a successful partnership.</p>

            <div class="login-button-container">
                    <a href="{{ $loginUrl }}" class="login-button">Login</a>
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
