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
        Schema::create('tables_billiards', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->integer('seats');
            $table->text('qr_code')->nullable();
            $table->string('location')->nullable();
            $table->foreignId('status_id')->nullable()->constrained('table_statuses')->nullOnDelete();
            $table->foreignId('table_type_id')->nullable()->constrained('table_types')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tables_billiards');
    }
};
