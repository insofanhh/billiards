# ==============================================
# Stage 1: Build Laravel dependencies
# ==============================================
FROM php:8.2-cli-alpine

# Cài các package cần cho Laravel
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev \
    postgresql-dev \
    icu-dev \
    icu-libs

# Cài PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    intl

# Cài Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Set thư mục làm việc
WORKDIR /var/www/html

# Copy file composer để cài dependency trước
COPY composer.json composer.lock ./

# Cài các package PHP
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Copy toàn bộ mã nguồn Laravel
COPY . .

# Set quyền truy cập storage và cache
RUN chmod -R 755 storage bootstrap/cache

# Cache cấu hình Laravel (nếu có)
RUN php artisan config:cache || true
RUN php artisan route:cache || true
RUN php artisan view:cache || true

# Render sử dụng port 10000
EXPOSE 10000

# Lệnh khởi chạy ứng dụng Laravel
CMD php artisan serve --host=0.0.0.0 --port=10000
