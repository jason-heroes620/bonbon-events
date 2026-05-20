<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneOrMany;

class Applications extends Model
{
    use HasUuids;

    protected $table = 'applications';
    protected $primaryKey = 'application_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'vendor_id',
        'event_id',
        'application_code',
        'participants',
        'no_of_booths',
        'requirements',
        'plug',
        'application_status',
    ];

    protected $casts = [
        'plug' => 'boolean',
        'social_medias' => 'array',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Events::class, 'event_id', 'event_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendors::class, 'vendor_id', 'vendor_id');
    }

    public function order(): HasOne
    {
        return $this->hasOne(Orders::class, 'application_id', 'application_id');
    }

    public function getRouteKeyName(): string
    {
        return 'application_id';
    }
}
