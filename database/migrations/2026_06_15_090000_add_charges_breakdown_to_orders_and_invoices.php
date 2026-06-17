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
        if (!Schema::hasColumn('orders', 'charges_total')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->decimal('charges_total', 10, 2)->default(0)->after('discount_price');
            });
        }

        if (!Schema::hasColumn('invoices', 'charges_total')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->decimal('charges_total', 10, 2)->default(0)->after('discount_amount');
            });
        }

        if (!Schema::hasTable('order_charges')) {
            Schema::create('order_charges', function (Blueprint $table) {
                $table->uuid('order_charge_id')->primary();
                $table->uuid('order_id')->index();
                $table->uuid('charges_id')->nullable()->index();
                $table->string('charges_name');
                $table->char('charges_type', 1);
                $table->decimal('charges_rate', 10, 2);
                $table->decimal('charges_amount', 10, 2);
                $table->tinyInteger('sort_order')->default(1);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('invoice_charges')) {
            Schema::create('invoice_charges', function (Blueprint $table) {
                $table->uuid('invoice_charge_id')->primary();
                $table->uuid('invoice_id')->index();
                $table->uuid('charges_id')->nullable()->index();
                $table->string('charges_name');
                $table->char('charges_type', 1);
                $table->decimal('charges_rate', 10, 2);
                $table->decimal('charges_amount', 10, 2);
                $table->tinyInteger('sort_order')->default(1);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_charges');
        Schema::dropIfExists('order_charges');

        if (Schema::hasColumn('invoices', 'charges_total')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn('charges_total');
            });
        }

        if (Schema::hasColumn('orders', 'charges_total')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('charges_total');
            });
        }
    }
};
