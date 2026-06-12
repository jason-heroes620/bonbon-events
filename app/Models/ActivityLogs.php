<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLogs extends Model
{
    protected $table = 'activity_logs';
    protected $fillable = [
        'application_code',
        'activity',
        'description',
        'user_id',
    ];
}
