<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationEvent extends Model
{
    use HasUuids;

    protected $table = 'application_events';
    protected $primaryKey = 'application_event_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'application_id',
        'event_id',
        'participants',
        'no_of_booths',
        'requirements',
        'plug',
        'application_status',
    ];

    protected $casts = [
        'plug' => 'boolean',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Applications::class, 'application_id', 'application_id');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Events::class, 'event_id', 'event_id');
    }

    public function getRouteKeyName(): string
    {
        return 'application_event_id';
    }
}

