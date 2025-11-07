FROM php:8.2-cli-alpine

RUN apk add --no-cache \
    git curl libpng-dev libzip-dev zip unzip oniguruma-dev postgresql-dev icu-dev icu-libs

RUN docker-php-ext-install \
    pdo pdo_pgsql pdo_mysql mbstring exif pcntl bcmath gd zip intl

WORKDIR /var/www/html

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY . .   # copy toàn bộ mã Laravel (composer.json sẽ có ở đây)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

RUN chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
