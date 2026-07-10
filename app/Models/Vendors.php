<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Vendors extends Model
{
    use HasUuids;

    protected $table = 'vendors';
    protected $primaryKey = 'vendor_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'vendor_name',
        'vendor_email',
        'vendor_contact_person',
        'vendor_contact_no',
        'business_name',
        'business_registration_no',
        'business_description',
        'social_medias',
        'category',
        'vendor_bank_name',
        'vendor_bank_account_no',
        'vendor_bank_account_name',
        'is_active',
        'vendor_status',
    ];
    protected $casts = [
        'social_medias' => 'array',
        'category' => 'array',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function getRouteKeyName(): string
    {
        return 'vendor_id';
    }
}
