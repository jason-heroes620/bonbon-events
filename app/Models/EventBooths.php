<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EventBooths extends Model
{
    use HasUuids;

    protected $table = 'event_booths';
    protected $primaryKey = 'event_booth_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'event_id',
        'booth_id',
        'booth_price',
        'occupied',
        'is_active',
    ];

    protected $casts = [
        'occupied' => 'boolean',
        'is_active' => 'boolean',
    ];
}
