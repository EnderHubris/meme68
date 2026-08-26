import { defineConfig } from "drizzle-kit";

// .env file read testing
console.log(`[*] Testing (${process.env.DB_USER!}:${process.env.DB_HOST!})`);

export default defineConfig({
  schema: "./src/lib/database/my-schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: process.env.DB_PORT! ? Number(process.env.DB_PORT!) : 3306,
    user: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    database: process.env.DB_NAME!
  }
});