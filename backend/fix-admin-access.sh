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

echo "👉 4. Tạo super_admin role và kiểm tra setup..."
if [ -f "scripts/fix-admin-setup.php" ]; then
    php scripts/fix-admin-setup.php
else
    echo "⚠️  Script fix-admin-setup.php không tồn tại, đang tạo role thủ công..."
    php artisan tinker --execute="
    use Spatie\Permission\Models\Role;
    try {
        \$role = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        echo '✅ Role super_admin đã được tạo hoặc đã tồn tại' . PHP_EOL;
    } catch (Exception \$e) {
        echo '⚠️  Lỗi: ' . \$e->getMessage() . PHP_EOL;
    }
    " 2>&1 | grep -E "(✅|⚠️|Role)" || true
fi

echo ""
echo "👉 5. Clear cache..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
php artisan permission:cache-reset

echo ""
echo "👉 6. Rebuild cache..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

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
echo "=== Hoàn tất ==="
echo "✅ Đã khắc phục các vấn đề cơ bản"
echo "📌 Tiếp theo:"
echo "   1. Assign super_admin role cho user của bạn"
echo "   2. Đảm bảo route /admin không bị chặn bởi web server"
echo "   3. Kiểm tra file .env có APP_URL đúng không"

