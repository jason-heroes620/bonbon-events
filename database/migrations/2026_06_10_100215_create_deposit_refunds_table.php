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
        Schema::create('deposit_refunds', function (Blueprint $table) {
            $table->id();
            $table->string('application_code');
            $table->decimal('refund_amount', 8, 2)->default(0);
            $table->string('refund_date')->nullable();
            $table->enum('refund_status', ['refunded', 'forfeited', 'pending'])->default('pending');
            $table->string('refund_file')->nullable();
            $table->string('refund_comment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deposit_refunds');
    }
};
