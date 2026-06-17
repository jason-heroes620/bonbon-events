<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OrderCharges extends Model
{
    use HasUuids;

    protected $table = 'order_charges';
    protected $primaryKey = 'order_charge_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'order_id',
        'charges_id',
        'charges_name',
        'charges_type',
        'charges_rate',
        'charges_amount',
        'sort_order',
    ];

    protected $casts = [
        'charges_rate' => 'float',
        'charges_amount' => 'float',
        'sort_order' => 'integer',
    ];

    public function getRouteKeyName(): string
    {
        return 'order_charge_id';
    }
}
