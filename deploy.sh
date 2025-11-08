#!/bin/bash
set -e

echo "Bắt đầu deploy..."
cd /var/www/billiards

echo "Pull code mới nhất"
git pull origin main

echo "Cập nhật backend (Laravel)"
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache

echo "Build frontend"
cd ../frontend
npm install
npm run build

echo "Deploy hoàn tất!"
