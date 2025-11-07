FROM php:8.2-cli-alpine

# Cài các gói cần thiết
RUN apk add --no-cache \
    git curl libpng-dev libzip-dev zip unzip oniguruma-dev postgresql-dev icu-dev icu-libs

# Cài các extension PHP cần thiết cho Laravel
RUN docker-php-ext-install \
    pdo pdo_pgsql pdo_mysql mbstring exif pcntl bcmath gd zip intl

# Đặt thư mục làm việc
WORKDIR /var/www/html

# Cài composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copy mã nguồn Laravel vào container
COPY . .

# Cài dependencies Laravel
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Thiết lập quyền
RUN chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

# Mở port 8000 và chạy server Laravel
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
