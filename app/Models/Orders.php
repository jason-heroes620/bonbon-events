<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Orders extends Model
{
    use HasUuids;

    protected $table = 'orders';
    protected $primaryKey = 'order_id';
    protected $keyType = 'uuid';
    public $incrementing = false;

    protected $fillable = [
        'order_no',
        'application_id',
        'application_code',
        'sub_total',
        'discount_price',
        'charges_total',
        'total_price',
        'is_paid',
        'is_active',
    ];

    protected $casts = [
        'sub_total' => 'float',
        'discount_price' => 'float',
        'charges_total' => 'float',
        'total_price' => 'float',
        'is_paid' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Applications::class, 'application_id', 'application_id');
    }
}
