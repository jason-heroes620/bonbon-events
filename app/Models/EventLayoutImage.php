<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventLayoutImage extends Model
{
    use HasUuids;

    protected $table = 'event_layout_images';
    protected $primaryKey = 'event_layout_image_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'event_id',
        'image_path',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Events::class, 'event_id', 'event_id');
    }
}
