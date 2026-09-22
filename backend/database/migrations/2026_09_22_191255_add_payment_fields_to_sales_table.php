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
        Schema::table('sales', function (Blueprint $table) {
            $table->enum('payment_method', [
                'cash',
                'charge',
            ])->default('cash')->after('total');

            $table->unsignedInteger('term_months')
                ->nullable()
                ->after('payment_method');

            $table->date('due_date')
                ->nullable()
                ->after('term_months');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'payment_method',
                'term_months',
                'due_date',
            ]);
        });
    }
};
