<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BoothTypes extends Model
{
    use HasUuids;

    protected $table = 'booth_types';
    protected $primaryKey = 'booth_type_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'booth_type_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function getRouteKeyName(): string
    {
        return 'booth_type_id';
    }
}
