#!/bin/bash

echo "=== Khắc phục lỗi truy cập Admin Panel ==="
cd "$(dirname "$0")"

echo "👉 1. Kiểm tra database connection..."
php artisan migrate:status > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Không thể kết nối database!"
    exit 1
fi
echo "✅ Database connection OK"

echo "👉 2. Chạy migrations..."
php artisan migrate --force

echo "👉 3. Đảm bảo Spatie Permission tables đã được tạo..."
php artisan permission:cache-reset 2>/dev/null || true

echo "👉 4. Tạo super_admin role nếu chưa có..."
php artisan db:seed --class=Spatie\\Permission\\Database\\Seeders\\DatabaseSeeder 2>/dev/null || true

echo "👉 5. Tạo permissions cho Filament Shield..."
php artisan shield:generate --all 2>/dev/null || echo "⚠️  Shield generate đã chạy hoặc có lỗi"

echo "👉 6. Liệt kê các user hiện có..."
php artisan tinker --execute="
\$users = App\Models\User::all(['id', 'name', 'email']);
if (\$users->count() > 0) {
    echo 'Users trong database:' . PHP_EOL;
    foreach (\$users as \$user) {
        echo '  - ID: ' . \$user->id . ', Email: ' . \$user->email . ', Name: ' . \$user->name . PHP_EOL;
    }
} else {
    echo 'Không có user nào trong database!' . PHP_EOL;
}
"

echo ""
echo "👉 7. Hướng dẫn assign super_admin role:"
echo "   Chạy lệnh sau với email của user bạn muốn assign:"
echo "   php artisan shield:super-admin"
echo ""
echo "   Hoặc assign thủ công bằng tinker:"
echo "   php artisan tinker"
echo "   \$user = App\Models\User::where('email', 'your-email@example.com')->first();"
echo "   \$user->assignRole('super_admin');"
echo "   exit"

echo ""
echo "👉 8. Clear cache..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
php artisan permission:cache-reset

echo ""
echo "👉 9. Rebuild cache..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo ""
echo "=== Hoàn tất ==="
echo "✅ Đã khắc phục các vấn đề cơ bản"
echo "📌 Tiếp theo:"
echo "   1. Assign super_admin role cho user của bạn"
echo "   2. Đảm bảo route /admin không bị chặn bởi web server"
echo "   3. Kiểm tra file .env có APP_URL đúng không"

