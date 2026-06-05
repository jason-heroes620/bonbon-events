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
        Schema::create('vendors', function (Blueprint $table) {
            $table->uuid('vendor_id')->primary();
            $table->uuid('user_id');
            $table->string('vendor_name', 255);
            $table->string('vendor_email', 255);
            $table->string('vendor_contact_person', 255);
            $table->string('vendor_contact_no', 255);
            $table->string('business_name', 255);
            $table->string('business_registration_no', 255);
            $table->text('business_description');
            $table->json('social_medias');
            $table->text('category');
            $table->string('vendor_bank_name')->nullable();
            $table->string('vendor_bank_account_no')->nullable();
            $table->string('vendor_bank_account_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};
