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
        Schema::create('event_booths', function (Blueprint $table) {
            $table->uuid('event_booth_id')->primary();
            $table->uuid('event_id');
            $table->uuid('booth_id');
            $table->decimal('booth_price', 8, 2);
            $table->boolean('occupied')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_booths');
    }
};
