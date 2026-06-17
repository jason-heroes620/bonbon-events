<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Invoices extends Model
{
    use HasUuids;

    protected $table = 'invoices';
    protected $primaryKey = 'invoice_id';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = [
        'order_id',
        'application_id',
        'invoice_no',
        'invoice_date',
        'sub_total',
        'discount_amount',
        'charges_total',
        'invoice_amount',
        'invoice_file',
        'invoice_status',
    ];

    protected $casts = [
        'sub_total' => 'float',
        'discount_amount' => 'float',
        'charges_total' => 'float',
        'invoice_amount' => 'float',
    ];
}
