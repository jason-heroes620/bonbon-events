<!doctype html>
<html lang="en">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Approved</title>
    <style>
        /* Base Styles */
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

        .email-logo {
            color: white;
            font-size: 28px;
            font-weight: bold;
            text-decoration: none;
        }

        .email-body {
            padding: 40px;
            text-align: left;
        }

        .email-content {
            font-size: 16px;
            color: #555;
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

        .footer-links {
            margin-top: 15px;
        }

        .footer-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }

        .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }

        .divider {
            height: 1px;
            background-color: #e9ecef;
            margin: 30px 0;
        }

        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 30px 20px;
            }
            
            .email-footer {
                padding: 20px;
            }
        }

        .booth-content {
            margin: auto;
            width: 80%;
            justify-content: 'center';
            border: 1px;
            border-color: '#000';
        }

        .payment-content {
            margin: auto;
            width: 90%;
            justify-content: 'center';
            border: 1px;
            border-color: '#000';
        }

        .email-address {
            display: grid;
            grid-template-columns: 1fr 1fr;
        }

        .table {
            border-spacing: 6px 5px;
        }

        .table_amount {
            text-align: right;
        }

        .tr_total {
            border-top: 2px solid black;
            border-bottom: 2px solid black;
        }

        th {
            background-color: #dce0e6;
          
        }

        .payment-button-container {
            text-align: center;
            margin: 24px 0;
        }

        .payment-button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
        }
    </style>
</head>
    <body>
        <div  class="email-container">
        <div  class="email-header">
            <img src="{{ asset('bonbon-logo.png') }}" alt="" width="60" class="email-logo">
        </div>   
        
        <div class="email-body">
            <p>Hi, {{ $userName }}!</p>
            <div>
                <p> We're thrilled to confirm your participation as a vendor at the upcoming event!</p>
            </div>
            <p>
                Application Code:
                <strong>{{ $applicationCode }}</strong>
            </p>
            <div>
                <p> To finalise your participation and secure your booth, please complete the payment using the link below within the next 5 days of receiving this email or at least 3 days before the event date whichever is earlier.</p>
            </div>
            <div class="payment-button-container">
                <a href="{{ $paymentUrl }}" class="payment-button">Payment Link</a>
            </div>
        </div>

        <div class="email-footer">
            <span  class="footer-text">Sincerely,</span><br>
            <span  class="footer-text">BonBon Event Team</span>
            <p></p>
           <div class="email-address">
                <div>
                    <span  class="footer-text">Contact No.: </span><br>
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
    </body>
</html>
