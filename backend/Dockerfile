FROM php:8.2-cli-alpine

RUN apk add --no-cache \
    git curl libpng-dev libzip-dev zip unzip oniguruma-dev postgresql-dev icu-dev icu-libs

RUN docker-php-ext-install \
    pdo pdo_pgsql pdo_mysql mbstring exif pcntl bcmath gd zip intl xml dom soap

WORKDIR /var/www/html

# ⚠️ Copy riêng composer.json và composer.lock trước để composer install có thể chạy
COPY composer.json composer.lock ./

# Cài composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Cài đặt các dependency
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Sau đó mới copy toàn bộ mã nguồn Laravel
COPY . .

RUN chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
