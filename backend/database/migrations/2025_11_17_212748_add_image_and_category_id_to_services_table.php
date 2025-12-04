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
        if (!Schema::hasTable('category_services')) {
            Schema::create('category_services', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique()->nullable();
                $table->text('description')->nullable();
                $table->integer('sort_order')->nullable()->default(0);
                $table->boolean('active')->default(true);
                $table->timestamps();
            });
        }

        Schema::table('services', function (Blueprint $table) {
            if (!Schema::hasColumn('services', 'image')) {
                $table->string('image')->nullable()->after('description');
            }
            if (!Schema::hasColumn('services', 'category_service_id')) {
                $table->foreignId('category_service_id')->nullable()->after('image')->constrained('category_services')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            if (Schema::hasColumn('services', 'category_service_id')) {
                $table->dropForeign(['category_service_id']);
                $table->dropColumn('category_service_id');
            }
            if (Schema::hasColumn('services', 'image')) {
                $table->dropColumn('image');
            }
        });

        if (Schema::hasTable('category_services')) {
            Schema::dropIfExists('category_services');
        }
    }
};
