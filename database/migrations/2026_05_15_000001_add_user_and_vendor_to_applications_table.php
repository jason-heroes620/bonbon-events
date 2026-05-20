<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('applications', 'user_id')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->uuid('user_id')->nullable()->after('application_id');
            });
        }

        if (!Schema::hasColumn('applications', 'vendor_id')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->uuid('vendor_id')->nullable()->after('user_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('applications', 'user_id')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->dropColumn(['user_id']);
            });
        }

        if (Schema::hasColumn('applications', 'vendor_id')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->dropColumn(['vendor_id']);
            });
        }
    }
};
