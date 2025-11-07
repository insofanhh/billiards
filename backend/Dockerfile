# ==============================================
# Stage 1: Build PHP dependencies with Composer
# ==============================================
FROM php:8.2-cli-alpine AS builder

# Cài các package cần thiết
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
    icu-libs \
    nodejs \
    npm

# Cài PHP extensions cần cho Laravel
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

WORKDIR /app

# Copy file composer và cài dependencies
COPY composer.json composer.lock ./
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# ==============================================
# Stage 2: Build frontend (nếu có)
# ==============================================
FROM node:18-alpine AS frontend

WORKDIR /frontend
COPY package*.json ./
RUN npm ci

COPY . . 
RUN npm run build || echo "No frontend build step"

# ==============================================
# Stage 3: Final Laravel app image
# ==============================================
FROM php:8.2-cli-alpine

# Cài các package cần thiết
RUN apk add --no-cache \
    libpng-dev \
    libzip-dev \
    oniguruma-dev \
    postgresql-dev \
    icu-dev \
    icu-libs

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

WORKDIR /var/www/html

# Copy vendor từ stage builder
COPY --from=builder /app/vendor ./vendor

# Copy toàn bộ code dự án
COPY . .

# Copy frontend build (nếu có) vào public/
COPY --from=frontend /frontend/dist ./public

# Set quyền cho Laravel
RUN chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Cache config để khởi động nhanh hơn
RUN php artisan config:cache || true
RUN php artisan route:cache || true
RUN php artisan view:cache || true

# Render yêu cầu port 10000
EXPOSE 10000

# Chạy Laravel server
CMD php artisan serve --host=0.0.0.0 --port=10000
