import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Integration tests use their own database, never the development one. CI can point
// TEST_DATABASE_URL at its service container. The global setup creates and migrates it.
const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://piano:piano@localhost:5432/piano_test";

process.env.TEST_DATABASE_URL = databaseUrl;

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    globalSetup: ["./vitest.integration.setup.ts"],
    // Files share one database and clean it between tests.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      NEXT_PUBLIC_APP_NAME: "Piano Habit Tracker",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      DATABASE_URL: databaseUrl,
      BETTER_AUTH_SECRET: "test-secret-for-automated-tests-only-0123456789",
    },
  },
});
