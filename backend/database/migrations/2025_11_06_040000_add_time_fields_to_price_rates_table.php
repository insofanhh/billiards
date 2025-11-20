<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('price_rates', function (Blueprint $table) {
            $table->json('day_of_week')->nullable()->after('active')->comment('Ngày trong tuần: [0,1,2...] (0=CN, 1=T2, 2=T3, ..., 6=T7)');
            $table->time('start_time')->nullable()->after('day_of_week')->comment('Giờ bắt đầu áp dụng giá');
            $table->time('end_time')->nullable()->after('start_time')->comment('Giờ kết thúc áp dụng giá');
            $table->integer('priority')->default(0)->after('end_time')->comment('Độ ưu tiên: số cao hơn = ưu tiên hơn');
        });
    }

    public function down(): void
    {
        Schema::table('price_rates', function (Blueprint $table) {
            $table->dropColumn(['day_of_week', 'start_time', 'end_time', 'priority']);
        });
    }
};

