<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bir_settings', function (Blueprint $table) {
            $table->string('tax_type', 20)
                ->default('vat_inclusive')
                ->after('vat_registered');

            $table->decimal('vat_rate', 5, 2)
                ->default(12.00)
                ->after('tax_type');
        });
    }

    public function down(): void
    {
        Schema::table('bir_settings', function (Blueprint $table) {
            $table->dropColumn([
                'tax_type',
                'vat_rate',
            ]);
        });
    }
};
