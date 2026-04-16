FROM php:8.3-apache

RUN docker-php-ext-install pdo pdo_mysql \
    && a2enmod rewrite

COPY docker/backend/apache.conf /etc/apache2/conf-enabled/zz-examhub.conf

WORKDIR /var/www/html
COPY api ./api
COPY backend ./backend

EXPOSE 80
