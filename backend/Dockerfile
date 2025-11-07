FROM php:8.2-cli-alpine

ENV COMPOSER_ALLOW_SUPERUSER=1

# System packages
RUN apk add --no-cache \
    git curl libpng-dev libzip-dev zip unzip \
    oniguruma-dev postgresql-dev icu-dev icu-libs

# PHP extensions
RUN docker-php-ext-install \
    pdo pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip intl

# Composer
RUN curl -sS https://getcomposer.org/installer \
  | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html

# 1) Cài vendor (KHÔNG chạy scripts để tránh cần file artisan)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts

# 2) Copy toàn bộ mã nguồn (có file artisan)
COPY . .

# 3) Hoàn tất autoload & scripts sau khi đã có artisan
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
RUN php artisan config:cache || true
RUN php artisan route:cache  || true
RUN php artisan view:cache   || true

# Quyền thư mục
RUN chmod -R 755 storage bootstrap/cache

# Render dùng port 10000
EXPOSE 10000
CMD php artisan serve --host=0.0.0.0 --port=10000
