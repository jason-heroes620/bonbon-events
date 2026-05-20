<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $applicationCode }} - Application Rejected</title>
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
    </style>
</head>
<body>
    <div  class="email-container">  
        <div  class="email-header">
            <img src="{{ asset('bonbon-logo.png') }}" alt="" width="60" class="email-logo">
        </div>                 

        <div class="email-body">
            <p> Hi {{ $userName }},</p>

            <p></p>
            <div>
                <p>Thank you for your interest in in participating in our upcoming "{{  $eventName }}" event.</p>
            </div>
            <p></p>
            <div>
                <p>We received an overwhelming number of applications from quality vendors this year. After careful consideration of all submissions, we regret to inform you that we are unable to accommodate your participation at this time. Our decisions were based on space limitations and the need to maintain a diverse and balanced vendor mix that aligns with our event objectives.</p>
            </div>
            <p></p>
            <div>
                <p>We genuinely appreciate the time and effort you invested in your application. We recognise the value of your products/services and encourage you to consider applying for our future events.</p>
            </div>
            <p></p>
            <div>
                <p>Thank you once again for your interest in BonBonEvents. We wish you continued success with your business.</p>
            </div>
            <p></p>
            <p></p>
        </div>
        <div class="email-footer">
            <span  class="footer-text">Yours sincerely,</span><br>
            <span  class="footer-text">BonBon Event Team</span>
            <p></p>
           <div class="email-address">
                <div>
                    <span  class="footer-text">Contact No.: </span><br>
                    <span class="footer-text">012 7456 785</span>
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