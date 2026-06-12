<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ApplicationBooths extends Model
{
    use HasUuids;

    protected $table = 'application_booths';
    protected $primaryKey = 'application_booth_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'application_id',
        'application_event_id',
        'booth_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
