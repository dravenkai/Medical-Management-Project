# syntax=docker/dockerfile:1
FROM php:8.3-cli-alpine

WORKDIR /app

# Only extension this backend actually uses (src/Core/Database.php is PDO
# only — see composer.json, there are no Composer dependencies at all, just
# a hand-rolled PSR-4 autoloader in src/Core/bootstrap.php).
RUN docker-php-ext-install pdo_mysql

COPY . .

EXPOSE 8000

# Same command as the README's local dev instructions (php -S ... router.php),
# minus the Windows-only -c php-mysql-sqlite.ini (this image already has
# pdo_mysql compiled in, no custom php.ini needed).
CMD ["php", "-S", "0.0.0.0:8000", "router.php"]
