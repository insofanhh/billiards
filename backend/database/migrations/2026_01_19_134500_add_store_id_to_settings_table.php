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
        Schema::table('settings', function (Blueprint $table) {
            $table->unsignedBigInteger('store_id')->nullable()->after('id');
            // Drop the old unique constraint (default is table_column_unique)
            // settings_group_name_unique
            $table->dropUnique(['group', 'name']);
            
            // Add new unique constraint including store_id
            $table->unique(['group', 'name', 'store_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique(['group', 'name', 'store_id']);
            $table->unique(['group', 'name']); // Restore old unique
            $table->dropColumn('store_id');
        });
    }
};
