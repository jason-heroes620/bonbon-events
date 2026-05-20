<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->uuid('application_id')->primary();
            $table->uuid('event_id');
            $table->string('application_code', 8);
            $table->uuid('vendor_id');
            $table->tinyInteger('participants')->default(1);
            $table->tinyInteger('no_of_booths')->default(1);
            $table->text('requirements')->nullable();
            $table->boolean('plug')->default(false);
            $table->enum('application_status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
