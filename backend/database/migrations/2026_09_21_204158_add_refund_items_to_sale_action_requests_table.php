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
        Schema::table('sale_action_requests', function (Blueprint $table) {
            $table->json('refund_items')
                ->nullable()
                ->after('reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_action_requests', function (Blueprint $table) {
            $table->dropColumn('refund_items');
        });
    }
};
