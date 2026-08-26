FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY drizzle.config.ts ./
COPY drizzle/ ./drizzle
COPY migrate/grant.ts ./

CMD echo "[*] Starting Migrations..." && \
bunx drizzle-kit migrate && echo '[+] Migration Successful!' \
&& bun run grant.ts && echo '[+] grant.ts successful!'