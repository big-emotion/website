# BIG EMOTION static site + contact.php, served behind the host-level Traefik.
# php:8.3-apache = Apache 2.4 + mod_php: the same serving model as the previous
# n0c shared host, so the exported .htaccess and contact.php work unchanged.
FROM php:8.3-apache

# msmtp-mta provides /usr/sbin/sendmail so PHP mail() relays through an
# authenticated upstream SMTP (a bare VPS has no MTA and poor IP reputation).
RUN apt-get update \
 && apt-get install -y --no-install-recommends msmtp-mta ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Modules the exported .htaccess relies on (rewrite, headers, deflate, expires).
RUN a2enmod rewrite headers deflate expires remoteip

# .htaccess stays the single source of server behavior, exactly like on shared
# hosting — hence AllowOverride All on the web root.
RUN printf '<Directory /var/www/html>\n    AllowOverride All\n</Directory>\n' \
      > /etc/apache2/conf-available/allow-override.conf \
 && a2enconf allow-override \
 && echo 'ServerName big-emotion.com' > /etc/apache2/conf-available/servername.conf \
 && a2enconf servername

# Behind Traefik, REMOTE_ADDR is the proxy's IP: without this, contact.php's
# per-IP rate limit would throttle ALL visitors as one. mod_remoteip restores
# the real client IP from X-Forwarded-For. Trusting the RFC1918 ranges is safe
# because the container publishes no ports — only Traefik can reach it.
RUN printf 'RemoteIPHeader X-Forwarded-For\nRemoteIPInternalProxy 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16\n' \
      > /etc/apache2/conf-available/remoteip.conf \
 && a2enconf remoteip

# Route PHP mail() through msmtp. contact.php's "-f" envelope-sender flag is
# passed through to msmtp untouched (Return-Path stays aligned with From).
RUN echo 'sendmail_path = "/usr/sbin/sendmail -t -i"' \
      > /usr/local/etc/php/conf.d/sendmail.ini

COPY entrypoint.sh /usr/local/bin/big-emotion-entrypoint
RUN chmod +x /usr/local/bin/big-emotion-entrypoint
ENTRYPOINT ["big-emotion-entrypoint"]
CMD ["apache2-foreground"]
