FROM php:8.2-apache

# MySQLi eklentisini kur
RUN docker-php-ext-install pdo pdo_mysql mysqli && docker-php-ext-enable pdo pdo_mysql mysqli

# mod_rewrite'ı etkinleştir
RUN a2enmod rewrite

# .htaccess dosyalarına izin ver
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Proje dosyalarını kopyala
COPY . /var/www/html/

# Portu aç
EXPOSE 80
