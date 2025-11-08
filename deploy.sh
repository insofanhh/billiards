#!/bin/bash
set -e

echo "=== Bắt đầu deploy ==="
cd /var/www/billiards

echo "👉 Làm sạch và cập nhật code mới nhất..."
git fetch origin main
git reset --hard origin/main

echo "👉 Cập nhật backend (Laravel)..."
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache

echo "👉 Build frontend..."
cd ../frontend
npm install

echo "👉 Build frontend với production config..."
VITE_API_URL=/api npm run build

echo "👉 Copy frontend build vào backend/public..."
cd ../backend/public

BACKUP_DIR=".laravel_backup"
mkdir -p "$BACKUP_DIR"

if [ -f "index.php" ]; then
    cp index.php "$BACKUP_DIR/" 2>/dev/null || true
fi

if [ -f ".htaccess" ]; then
    cp .htaccess "$BACKUP_DIR/" 2>/dev/null || true
fi

cd ../../frontend

if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    echo "❌ Lỗi: Frontend chưa được build hoặc thư mục dist rỗng!"
    exit 1
fi

echo "👉 Copy tất cả files từ frontend/dist..."
cp -r dist/* ../backend/public/ 2>/dev/null || true

cd ../backend/public

if [ -f "$BACKUP_DIR/index.php" ]; then
    echo "👉 Đảm bảo index.php của Laravel vẫn tồn tại..."
    if [ ! -f "index.php" ]; then
        cp "$BACKUP_DIR/index.php" .
    fi
fi

if [ -f "$BACKUP_DIR/.htaccess" ]; then
    echo "👉 Đảm bảo .htaccess của Laravel vẫn tồn tại..."
    if [ ! -f ".htaccess" ]; then
        cp "$BACKUP_DIR/.htaccess" .
    fi
fi

echo "👉 Set quyền thư mục..."
cd /var/www/billiards/backend
chown -R www-data:www-data storage bootstrap/cache public
chmod -R 775 storage bootstrap/cache
chmod -R 755 public

echo "=== Deploy hoàn tất thành công ==="
