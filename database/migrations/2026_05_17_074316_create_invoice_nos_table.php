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
        Schema::create('invoice_nos', function (Blueprint $table) {
            $table->uuid('invoice_no_id')->primary();
            $table->string('prefix', 20);
            $table->string('invoice_no');
            $table->string('suffix')->default('0');
            $table->tinyinteger('length', 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_nos');
    }
};
