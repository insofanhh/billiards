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
        Schema::table('discount_codes', function (Blueprint $table) {
            if (!Schema::hasColumn('discount_codes', 'public_discount')) {
                $table->boolean('public_discount')
                    ->default(false)
                    ->after('active');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('discount_codes', function (Blueprint $table) {
            if (Schema::hasColumn('discount_codes', 'public_discount')) {
                $table->dropColumn('public_discount');
            }
        });
    }
};
