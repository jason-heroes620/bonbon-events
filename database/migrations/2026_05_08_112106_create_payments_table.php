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
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('payment_id')->primary();
            $table->uuid('order_id');
            $table->string('order_no', 255);
            $table->string('transaction_id', 50);
            $table->decimal('payment_amount', 8, 2);
            $table->datetime('payment_date');
            $table->string('issuing_bank', 255)->nullable();
            $table->string('cc_name', 255)->nullable();
            $table->string('cc_number', 255)->nullable();
            $table->tinyInteger('payment_status')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
