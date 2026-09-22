<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sale_id')
                ->constrained('sales')
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->constrained('customers')
                ->restrictOnDelete();

            $table->date('payment_date');

            $table->decimal('amount', 12, 2);

            $table->string('payment_method')->default('cash');

            $table->string('reference_number')->nullable();

            $table->text('notes')->nullable();

            $table->foreignId('received_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->timestamps();

            $table->index('payment_date');
            $table->index('customer_id');
            $table->index('sale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_payments');
    }
};
