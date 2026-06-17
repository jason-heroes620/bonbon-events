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
        Schema::create('charges', function (Blueprint $table) {
            $table->uuid('charges_id')->primary();
            $table->string('charges_name');
            $table->char('charges_type', 1);
            $table->decimal('charges_rate', 10, 2);
            $table->string('charges_description')->nullable();
            $table->date('charges_start_date');
            $table->date('charges_end_date')->nullable();
            $table->boolean('charges_status')->default(true);
            $table->tinyInteger('sort_order')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};
