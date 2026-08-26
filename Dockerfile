# Builder reference
FROM oven/bun:1 AS build

WORKDIR /app
COPY drizzle/ ./drizzle
COPY src/ ./src
COPY static/ ./static
COPY drizzle.config.ts bun.lock package.json svelte.config.js tsconfig.json vite.config.ts .

RUN bun install --frozen-lockfile && bun run build

# Build the main application container
FROM nginx:latest

RUN apt-get update && apt-get install -y \
supervisor \
net-tools \
gettext-base && rm -rf /var/lib/apt/lists/*

COPY --from=build /usr/local/bin/bun /usr/local/bin/bun

RUN mkdir -p /app

COPY meme68.conf /etc/nginx/meme68.conf

WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# prep entry script and execute it
COPY entrypoint.sh /root/entrypoint.sh
RUN chmod +x /root/entrypoint.sh
CMD ["/root/entrypoint.sh"]