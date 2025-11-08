#!/bin/bash
set -e

echo "=== Bắt đầu deploy ==="
cd /var/www/billiards

echo "👉 Kiểm tra môi trường..."
PHP_VERSION=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
echo "📌 PHP Version: $PHP_VERSION"

echo "👉 Làm sạch và cập nhật code mới nhất..."
git fetch origin main
git reset --hard origin/main

echo "👉 Kiểm tra PHP extensions cần thiết..."
REQUIRED_EXTENSIONS=("dom" "intl" "curl" "gd" "mbstring" "xml" "zip" "pdo" "pdo_mysql")
MISSING_EXTENSIONS=()

for ext in "${REQUIRED_EXTENSIONS[@]}"; do
    if php -m | grep -q "^$ext$"; then
        echo "✅ PHP extension $ext đã được cài đặt"
    else
        echo "⚠️  PHP extension $ext chưa được cài đặt"
        MISSING_EXTENSIONS+=("$ext")
    fi
done

if [ ${#MISSING_EXTENSIONS[@]} -gt 0 ]; then
    echo "👉 Cố gắng cài đặt các PHP extensions còn thiếu cho PHP $PHP_VERSION..."
    
    for ext in "${MISSING_EXTENSIONS[@]}"; do
        INSTALLED=0
        
        if command -v apt-get &> /dev/null; then
            echo "   Đang thử cài đặt php${PHP_VERSION}-${ext}..."
            set +e
            if sudo apt-get update -qq > /dev/null 2>&1 && \
               sudo apt-get install -y -qq "php${PHP_VERSION}-${ext}" > /dev/null 2>&1; then
                echo "✅ Đã cài đặt php${PHP_VERSION}-${ext}"
                INSTALLED=1
            elif sudo apt-get install -y -qq "php-${ext}" > /dev/null 2>&1; then
                echo "✅ Đã cài đặt php-${ext} (generic)"
                INSTALLED=1
            fi
            set -e
        elif command -v yum &> /dev/null; then
            echo "   Đang thử cài đặt php${PHP_VERSION}-${ext}..."
            set +e
            if sudo yum install -y -q "php${PHP_VERSION}-${ext}" > /dev/null 2>&1; then
                echo "✅ Đã cài đặt php${PHP_VERSION}-${ext}"
                INSTALLED=1
            elif sudo yum install -y -q "php-${ext}" > /dev/null 2>&1; then
                echo "✅ Đã cài đặt php-${ext} (generic)"
                INSTALLED=1
            fi
            set -e
        fi
        
        if [ $INSTALLED -eq 0 ]; then
            echo "⚠️  Không thể cài đặt extension $ext tự động."
            echo "   Vui lòng cài đặt thủ công: sudo apt-get install php${PHP_VERSION}-${ext}"
        fi
    done
fi

echo "👉 Cập nhật backend (Laravel)..."
cd backend

echo "👉 Chạy composer install..."
set +e
composer install --no-dev --optimize-autoloader
COMPOSER_EXIT_CODE=$?
set -e

if [ $COMPOSER_EXIT_CODE -ne 0 ]; then
    echo "⚠️  Composer install thất bại với các platform requirements mặc định."
    echo "👉 Thử lại với --ignore-platform-req flags..."
    set +e
    composer install --no-dev --optimize-autoloader \
        --ignore-platform-req=ext-dom \
        --ignore-platform-req=ext-intl \
        --ignore-platform-req=ext-curl \
        --ignore-platform-req=ext-gd \
        --ignore-platform-req=ext-mbstring \
        --ignore-platform-req=ext-xml \
        --ignore-platform-req=ext-zip
    COMPOSER_EXIT_CODE=$?
    set -e
    
    if [ $COMPOSER_EXIT_CODE -ne 0 ]; then
        echo "❌ Composer install thất bại!"
        echo "👉 Vui lòng cài đặt các PHP extensions cần thiết trên server:"
        echo "   - ext-dom, ext-intl, ext-curl, ext-gd, ext-mbstring, ext-xml, ext-zip"
        exit 1
    fi
fi
php artisan migrate --force
php artisan optimize:clear

echo "👉 Thiết lập Filament Shield..."
php artisan permission:cache-reset 2>/dev/null || true
php artisan shield:generate --all 2>/dev/null || echo "⚠️  Shield permissions đã được tạo hoặc có lỗi"

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
