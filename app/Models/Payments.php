<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Payments extends Model
{
    use HasUuids;

    protected $table = 'payments';
    protected $primaryKey = 'payment_id';
    protected $fillable = [
        'order_id',
        'order_no',
        'transaction_id',
        'payment_amount',
        'payment_date',
        'payment_method',
        'issuing_bank',
        'cc_name',
        'cc_number',
        'payment_file',
        'payment_status',
    ];

    protected $casts = [
        'payment_status' => 'boolean',
    ];
}
