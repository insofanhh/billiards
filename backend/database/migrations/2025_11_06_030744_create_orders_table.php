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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code', 100)->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('table_id')->constrained('tables_billiards')->cascadeOnDelete();
            $table->foreignId('price_rate_id')->constrained('price_rates')->cascadeOnDelete();
            $table->foreignId('admin_confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->string('status', 50)->default('pending');
            $table->foreignId('applied_discount_id')->nullable()->constrained('discount_codes')->nullOnDelete();
            $table->foreignId('order_status_id')->nullable()->constrained('order_statuses')->nullOnDelete();
            $table->integer('total_play_time_minutes')->nullable();
            $table->decimal('total_before_discount', 12, 2)->default(0);
            $table->decimal('total_discount', 12, 2)->default(0);
            $table->decimal('total_paid', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
