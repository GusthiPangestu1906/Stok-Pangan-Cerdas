#!/bin/sh
set -e

# Set default port if not provided by environment (Render passes $PORT)
PORT="${PORT:-8080}"
echo "Configuring Nginx to listen on port $PORT..."
sed -i "s/__PORT__/$PORT/g" /etc/nginx/http.d/default.conf

# Execute Laravel migrations if enabled
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force || echo "Migration command returned an error (skipping)..."
fi

# Execute database seeders if enabled
if [ "$RUN_SEEDER" = "true" ]; then
    echo "Running database seeders..."
    php artisan db:seed --force || echo "Seeder command returned an error (skipping)..."
fi

# Cache configurations and routes for performance
echo "Caching configuration and routes..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Start PHP-FPM in background
echo "Starting PHP-FPM..."
php-fpm -D

# Start Nginx in foreground
echo "Starting Nginx web server on port $PORT..."
exec nginx -g "daemon off;"
