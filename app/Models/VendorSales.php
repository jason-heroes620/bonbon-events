<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VendorSales extends Model
{
    use HasUuids;

    protected $table = 'vendor_sales';
    protected $primaryKey = 'vendor_sales_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'vendor_id',
        'application_id',
        'event_id',
        'total_sales_amount',
    ];
}
