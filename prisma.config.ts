import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js keeps local settings in .env.local, but Prisma only reads .env by default.
// dotenv never overrides variables that are already set, so .env.local wins over .env.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
