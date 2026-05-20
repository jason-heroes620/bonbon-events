<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class InvoiceNo extends Model
{
    use HasUuids;

    protected $table = 'invoice_nos';
    protected $primaryKey = 'invoice_no_id';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = [
        'prefix',
        'invoice_no',
        'suffix',
        'length'
    ];

    public function getRouteKeyName(): string
    {
        return 'invoice_no_id';
    }
}
