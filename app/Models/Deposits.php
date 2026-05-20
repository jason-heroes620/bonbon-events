<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Deposits extends Model
{
    use HasUuids;

    protected $table = 'deposits';
    protected $primaryKey = 'deposit_id';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = [
        'deposit_description',
        'deposit_amount',
        'deposit_start_date',
        'deposit_end_date',
        'deposit_status',
    ];
    protected $casts = [
        'deposit_amount' => 'float',
    ];

    public function getRouteKeyName(): string
    {
        return 'deposit_id';
    }
}
