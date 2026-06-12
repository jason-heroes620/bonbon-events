<?php

namespace App\Services;

use App\Models\ActivityLogs;

class ActivityLogService
{
    /**
     * Log activity.
     */
    public function logActivity(
        string $applicationCode,
        string $activityType,
        string $activityDescription,
        string $userId
    ): void {
        // Log activity to database
        ActivityLogs::create([
            'application_code' => $applicationCode,
            'activity' => $activityType,
            'description' => $activityDescription,
            'user_id' => $userId,
        ]);
    }
}
