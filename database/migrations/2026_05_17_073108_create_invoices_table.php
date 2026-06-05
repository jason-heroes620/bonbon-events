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
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('invoice_id')->primary();
            $table->uuid('order_id');
            $table->uuid('application_id');
            $table->string('invoice_no');
            $table->string('invoice_date');
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('invoice_amount', 10, 2)->default(0);
            $table->string('invoice_file')->nullable();
            $table->enum('invoice_status', ['pending', 'paid', 'canceled']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
