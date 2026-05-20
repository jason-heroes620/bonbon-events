<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class OrderItems extends Model
{
    use HasUuids;

    protected $table = 'order_items';
    protected $primaryKey = 'order_item_id';
    protected $keyType = 'uuid';
    public $incrementing = false;

    protected $fillable = [
        'order_id',
        'quantity',
        'price',
        'item_description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
