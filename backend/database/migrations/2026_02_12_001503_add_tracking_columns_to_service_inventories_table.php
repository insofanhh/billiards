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
        Schema::table('service_inventories', function (Blueprint $table) {
            $table->decimal('average_cost', 15, 2)->default(0)->after('quantity');
            $table->dateTime('last_restock_date')->nullable()->after('average_cost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_inventories', function (Blueprint $table) {
            $table->dropColumn(['average_cost', 'last_restock_date']);
        });
    }
};
