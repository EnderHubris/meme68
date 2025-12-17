FROM nginx:latest
WORKDIR /
RUN apt-get update && apt-get install -y supervisor sudo nodejs npm net-tools

# initial file system preperation
RUN mkdir -p /var/www/meme68/uploads
RUN mkdir -p /var/www/project
# create challenge directory before starting certbot
RUN mkdir -p /var/www/certbot/.well-known/acme-challenge

RUN chsh -s /bin/bash www-data

# move svelte folders into project area
COPY src/ /var/www/project/src
COPY static/ /var/www/project/static
COPY package.json package-lock.json /var/www/project/
COPY .env /var/www/meme68/
RUN ln -s /var/www/meme68/.env /var/www/project/.env
COPY svelte.config.js tsconfig.json vite.config.ts build_svelte.sh /var/www/project/

# move backend files
COPY backend /var/www/project/backend

# prep build handler and build NGINX production files
RUN chown -R www-data:www-data /var/www
RUN chmod +x /var/www/project/build_svelte.sh
RUN su www-data -c 'bash /var/www/project/build_svelte.sh'

# configure NGINX
RUN rm /etc/nginx/conf.d/default.conf
COPY meme68.conf /etc/nginx/conf.d/meme68.conf
# give NGINX a dummy cert so it can start up
RUN mkdir -p /etc/letsencrypt/live/meme68.com && \
    openssl req -x509 -nodes -days 365 \
        -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/meme68.com/privkey.pem \
        -out /etc/letsencrypt/live/meme68.com/fullchain.pem \
        -subj "/CN=meme68.com"

EXPOSE 80 443

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# prep entry script and execute it
COPY entrypoint.sh /root/entrypoint.sh
RUN chmod +x /root/entrypoint.sh

CMD ["/root/entrypoint.sh"]