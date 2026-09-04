FROM php:8.4-fpm-alpine

# Install system dependencies & PHP extensions for Laravel + PostgreSQL
RUN apk add --no-cache \
    nginx \
    bash \
    curl \
    libpq-dev \
    libzip-dev \
    postgresql-client \
    && docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    zip \
    bcmath \
    opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application source code
COPY . .

# Install PHP dependencies without dev packages
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Create necessary storage directories and assign permissions
RUN mkdir -p /var/www/html/storage/logs \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Copy Nginx configuration and entrypoint
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
