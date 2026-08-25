<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bir_settings', function (Blueprint $table) {
            $table->id();

            // Taxpayer information
            $table->string('tin', 20);
            $table->string('branch_code', 10)->default('00000');

            $table->string('registered_name');
            $table->string('business_name')->nullable();
            $table->text('business_address');

            // Tax classification
            $table->boolean('vat_registered')->default(false);

            // Invoice numbering
            $table->string('invoice_prefix', 20)->default('INV-');
            $table->unsignedBigInteger('invoice_current')->default(0);

            // BIR registration / permit information
            $table->string('permit_number', 100)->nullable();
            $table->date('permit_date')->nullable();

            $table->string('accreditation_number', 100)->nullable();
            $table->date('accreditation_date')->nullable();

            // POS configuration status
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('tin');
            $table->index('branch_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bir_settings');
    }
};
