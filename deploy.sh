#!/bin/bash
set -e

echo "=== Bắt đầu deploy ==="
cd /var/www/billiards

echo "--> Kiểm tra môi trường..."
PHP_VERSION=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
echo "--> PHP Version: $PHP_VERSION"

# Git operations được xử lý ở GitHub Actions YAML để tránh lỗi permission
# git fetch origin main
# git reset --hard origin/main

echo "--> Kiểm tra PHP extensions cần thiết..."
REQUIRED_EXTENSIONS=("dom" "intl" "curl" "gd" "mbstring" "xml" "zip" "pdo" "pdo_mysql")
MISSING_EXTENSIONS=()

for ext in "${REQUIRED_EXTENSIONS[@]}"; do
    if php -m | grep -q "^$ext$"; then
        echo "--> PHP extension $ext đã được cài đặt"
    else
        echo "--> PHP extension $ext chưa được cài đặt"
        MISSING_EXTENSIONS+=("$ext")
    fi
done

if [ ${#MISSING_EXTENSIONS[@]} -gt 0 ]; then
    echo "--> Cố gắng cài đặt các PHP extensions còn thiếu cho PHP $PHP_VERSION..."
    for ext in "${MISSING_EXTENSIONS[@]}"; do
        if command -v apt-get &> /dev/null; then
            set +e
            sudo apt-get update -qq > /dev/null 2>&1
            sudo apt-get install -y -qq "php${PHP_VERSION}-${ext}" > /dev/null 2>&1 || sudo apt-get install -y -qq "php-${ext}" > /dev/null 2>&1
            set -e
        elif command -v yum &> /dev/null; then
            set +e
            sudo yum install -y -q "php${PHP_VERSION}-${ext}" > /dev/null 2>&1 || sudo yum install -y -q "php-${ext}" > /dev/null 2>&1
            set -e
        fi
    done
fi

echo "--> Cập nhật backend (Laravel)..."
cd backend

echo "--> Chạy composer install..."
set +e
composer install --no-dev --optimize-autoloader
if [ $? -ne 0 ]; then
    echo "--> Thử lại với --ignore-platform-reqs..."
    composer install --no-dev --optimize-autoloader --ignore-platform-reqs
fi
set -e

php artisan migrate --force

echo "--> Optimize & Cache..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# === [BỔ SUNG QUAN TRỌNG 1] ===
# Bắt buộc chạy lệnh này để copy CSS/JS mới nhất của Filament ra public
# Nếu thiếu lệnh này, sau khi update code giao diện Admin có thể bị lỗi
echo "--> Publish Filament Assets..."
php artisan filament:assets --force

# === [BỔ SUNG QUAN TRỌNG 2] ===
# Link storage để đảm bảo ảnh upload hiển thị được (chạy thừa còn hơn thiếu)
php artisan storage:link

echo "--> Build frontend..."
cd ../frontend
echo "--> Installing npm dependencies..."
npm install --legacy-peer-deps

echo "--> Build frontend với production config..."
VITE_API_URL=/api npm run build

echo "--> Copy frontend build vào backend/public..."
cd ../backend/public

BACKUP_DIR=".laravel_backup"
mkdir -p "$BACKUP_DIR"
[ -f "index.php" ] && cp index.php "$BACKUP_DIR/" 2>/dev/null || true
[ -f ".htaccess" ] && cp .htaccess "$BACKUP_DIR/" 2>/dev/null || true

cd ../../frontend
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    echo "--> Lỗi: Frontend chưa được build hoặc thư mục dist rỗng!"
    exit 1
fi

echo "--> Copy tất cả files từ frontend/dist..."
cp -r dist/* ../backend/public/ 2>/dev/null || true

cd ../backend/public
[ -f "$BACKUP_DIR/index.php" ] && cp "$BACKUP_DIR/index.php" .
[ -f "$BACKUP_DIR/.htaccess" ] && cp "$BACKUP_DIR/.htaccess" .

echo "--> Set quyền thư mục (Cần quyền sudo NOPASSWD)..."
cd /var/www/billiards/backend

# Tạo thư mục livewire-tmp nếu chưa có (để tránh lỗi upload)
sudo mkdir -p storage/app/livewire-tmp

sudo chown -R www-data:www-data storage bootstrap/cache public
sudo chmod -R 775 storage bootstrap/cache storage/app/livewire-tmp
sudo chmod -R 755 public

# ===