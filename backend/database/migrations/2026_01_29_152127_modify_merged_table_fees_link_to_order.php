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
        if (!Schema::hasColumn('merged_table_fees', 'order_id')) {
            Schema::table('merged_table_fees', function (Blueprint $table) {
                $table->foreignId('order_id')->constrained()->cascadeOnDelete()->after('store_id');
            });
        }

        if (Schema::hasColumn('merged_table_fees', 'order_item_id')) {
            Schema::table('merged_table_fees', function (Blueprint $table) {
                $table->dropForeign(['order_item_id']);
                $table->dropColumn('order_item_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('merged_table_fees', function (Blueprint $table) {
            //
        });
    }
};
