<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Add new status column with default 'Trống'
        Schema::table('tables_billiards', function (Blueprint $table) {
            $table->string('status', 50)->default('Trống')->after('location');
        });

        // Step 2: Migrate data from status_id to status string
        // Map status_id to status name based on table_statuses table
        if (Schema::hasTable('table_statuses')) {
            DB::statement("
                UPDATE tables_billiards tb
                SET tb.status = COALESCE(
                    (SELECT ts.name FROM table_statuses ts WHERE ts.id = tb.status_id),
                    'Trống'
                )
            ");
        }

        // Step 3: Drop the foreign key and status_id column
        Schema::table('tables_billiards', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['status_id']);
            $table->dropColumn('status_id');
        });

        // Step 4: Drop the table_statuses table
        Schema::dropIfExists('table_statuses');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate table_statuses table
        Schema::create('table_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->nullable()->constrained('stores')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('color', 20)->default('#000000');
            $table->timestamps();
        });

        // Insert default statuses
        DB::table('table_statuses')->insert([
            ['name' => 'Trống', 'color' => '#22c55e', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Đang sử dụng', 'color' => '#ef4444', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Bảo trì', 'color' => '#f59e0b', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Re-add status_id column
        Schema::table('tables_billiards', function (Blueprint $table) {
            $table->foreignId('status_id')->nullable()->after('location')->constrained('table_statuses')->nullOnDelete();
        });

        // Migrate data back from status to status_id
        DB::statement("
            UPDATE tables_billiards tb
            SET tb.status_id = (
                SELECT ts.id FROM table_statuses ts WHERE ts.name = tb.status LIMIT 1
            )
        ");

        // Drop status column
        Schema::table('tables_billiards', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
