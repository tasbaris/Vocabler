FROM php:8.2-apache

# MySQLi eklentisini kur
RUN docker-php-ext-install pdo pdo_mysql mysqli && docker-php-ext-enable pdo pdo_mysql mysqli

# Proje dosyalarını kopyala
COPY . /var/www/html/

# Portu aç
EXPOSE 80
