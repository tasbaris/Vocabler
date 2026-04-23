FROM php:8.2-apache

# MySQLi eklentisini kur
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

# Proje dosyalarını kopyala
COPY . /var/www/html/

# Portu aç
EXPOSE 80
