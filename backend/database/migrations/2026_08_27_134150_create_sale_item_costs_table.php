<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_item_costs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sale_item_id')
                ->constrained('sale_items')
                ->cascadeOnDelete();

            $table->foreignId('inventory_transaction_id')
                ->constrained('inventory_transactions')
                ->restrictOnDelete();

            $table->decimal('quantity', 12, 3);

            $table->decimal('unit_cost', 12, 2);

            $table->decimal('total_cost', 12, 2);

            $table->timestamps();

            $table->index('sale_item_id');

            $table->index('inventory_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_item_costs');
    }
};
