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
npm run build

echo "👉 Set quyền thư mục..."
chown -R www-data:www-data /var/www/billiards/backend/storage /var/www/billiards/backend/bootstrap/cache
chmod -R 775 /var/www/billiards/backend/storage /var/www/billiards/backend/bootstrap/cache

echo "=== Deploy hoàn tất thành công ==="
