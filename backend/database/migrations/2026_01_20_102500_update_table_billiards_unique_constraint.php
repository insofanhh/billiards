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
        Schema::table('tables_billiards', function (Blueprint $table) {
            $table->dropUnique('tables_billiards_code_unique');
            $table->unique(['store_id', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tables_billiards', function (Blueprint $table) {
            $table->dropUnique(['store_id', 'code']);
            $table->unique('code');
        });
    }
};
