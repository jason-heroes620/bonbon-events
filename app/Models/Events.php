<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Events extends Model
{
    use HasUuids;

    protected $table = 'events';
    protected $primaryKey = 'event_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'event_name',
        'event_description',
        'event_date',
        'event_time',
        'location_id',
        'venue',
        'event_start_date',
        'event_end_date',
        'event_booth_layout',
        'event_image',
        'require_deposit',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'require_deposit' => 'boolean',
        'event_start_date' => 'date:Y-m-d',
        'event_end_date' => 'date:Y-m-d',
    ];

    public function location(): BelongsTo
    {
        return $this->belongsTo(Locations::class, 'location_id', 'location_id');
    }

    public function deposit(): HasOne
    {
        return $this->hasOne(EventDeposits::class, 'event_id', 'event_id');
    }

    public function layoutImages(): HasMany
    {
        return $this->hasMany(EventLayoutImage::class, 'event_id', 'event_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at');
    }

    public function getRouteKeyName(): string
    {
        return 'event_id';
    }
}
