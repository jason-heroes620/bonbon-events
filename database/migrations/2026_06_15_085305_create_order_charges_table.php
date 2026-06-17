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
        Schema::create('order_charges', function (Blueprint $table) {
            $table->uuid('order_charges_id')->primary();
            $table->uuid('order_id')->index();
            $table->string('order_charges_name');
            $table->char('order_charges_type', 1);
            $table->decimal('order_charges_rate', 10, 2);
            $table->decimal('order_charges_amount', 10, 2);
            $table->tinyInteger('sort_order')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_charges');
    }
};
