<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventDeposits extends Model
{
    use HasUuids;

    protected $table = 'event_deposits';
    protected $primaryKey = 'event_deposit_id';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = [
        'event_id',
        'deposit_id',
        'event_deposit_status',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Events::class, 'event_id', 'event_id');
    }
}
