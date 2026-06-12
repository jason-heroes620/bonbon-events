<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DepositRefunds extends Model
{
    protected $table = 'deposit_refunds';
    protected $fillable = [
        'application_code',
        'refund_amount',
        'refund_date',
        'refund_status',
        'refund_file',
        'refund_comment',
    ];
}
