<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesRanges extends Model
{
    protected $table = 'sales_ranges';
    protected $primaryKey = 'id';
    protected $keyType = 'int';
    public $incrementing = true;

    protected $fillable = [
        'sales_range',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
