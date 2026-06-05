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
        'discount_amount',
        'invoice_amount',
        'invoice_file',
        'invoice_status',
    ];
}
