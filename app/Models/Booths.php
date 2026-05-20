<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Booths extends Model
{
    use HasUuids;

    protected $table = 'booths';
    protected $primaryKey = 'booth_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'booth_type_id',
        'booth_name',
        'booth_description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function boothType(): BelongsTo
    {
        return $this->belongsTo(BoothTypes::class, 'booth_type_id', 'booth_type_id');
    }

    public function getRouteKeyName(): string
    {
        return 'booth_id';
    }
}
