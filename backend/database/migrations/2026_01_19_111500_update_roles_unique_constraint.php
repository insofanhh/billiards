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
        Schema::table('roles', function (Blueprint $table) {
            // Drop the existing unique constraint
            // Note: We wrap in try-catch or check existence usually, but Schema::table handles direct calls.
            // However, to be safe, we assume the index exists as per the error message.
            $table->dropUnique('roles_name_guard_name_unique');

            // Add the new unique constraint including store_id
            $table->unique(['name', 'guard_name', 'store_id'], 'roles_name_guard_name_store_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropUnique('roles_name_guard_name_store_id_unique');
            $table->unique(['name', 'guard_name'], 'roles_name_guard_name_unique');
        });
    }
};
