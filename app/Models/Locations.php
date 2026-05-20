<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Locations extends Model
{
    use HasUuids;

    protected $table = 'locations';
    protected $primaryKey = 'location_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'location_name',
        'location_description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function getRouteKeyName(): string
    {
        return 'location_id';
    }
}
