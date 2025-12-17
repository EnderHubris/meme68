#!/bin/bash
set -e

# Start supervisord in the background
/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf &

# Wait until supervisor socket exists
echo "Waiting for supervisord socket..."
while [ ! -S /var/run/supervisor.sock ]; do
    sleep 0.1
done

# Reload nginx if certs exist
if [ -f /etc/letsencrypt/live/meme68.com/fullchain.pem ] && [ -f /etc/letsencrypt/live/meme68.com/privkey.pem ]; then
    echo "Reloading NGINX with LetsEncrypt certs..."
    supervisorctl restart nginx
fi

# ensure certbot challenge directory is present and modifiable by www-data
mkdir -p /var/www/certbot/.well-known/acme-challenge
chown -R www-data:www-data /var/www/certbot

# Keep container alive
wait