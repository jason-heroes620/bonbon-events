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
        Schema::create('events', function (Blueprint $table) {
            $table->uuid('event_id')->primary();
            $table->string('event_name', 255);
            $table->string('event_description', 255)->nullable();
            $table->string('event_date');
            $table->string('event_time');
            $table->uuid('location_id');
            $table->string('venue', 255)->nullable();
            $table->date('event_start_date');
            $table->date('event_end_date');
            $table->text('event_booth_layout')->nullable();
            $table->text('event_image')->nullable();
            $table->boolean('require_deposit')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
