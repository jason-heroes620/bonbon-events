<html>
    <body>
        <div>
            <p>Hi Admin, </p>
        </div>
        <div>
            <p>
                A new vendor registration has been received.
            </p>
        </div>
        <div>
            <p>Here are the details:</p>
            <span>Vendor Name: {{ $vendor->vendor_name }} </span><br>
            <span>Vendor Email: {{ $vendor->vendor_email }} </span><br>
            <span>Contact Person: {{ $vendor->contact_person }} </span><br>
            <span>Contact No.: {{ $vendor->contact_no }} </span><br>
        </div>
        <div>
            <p>
                Please check the vendor information for further action.
            </p>
        </div>
        <div>
            
        </div>
    </body>
</html>