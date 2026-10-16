import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Only unit/integration tests under src. End-to-end tests live in /e2e and run with Playwright.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    restoreMocks: true,
    unstubEnvs: true,
    env: {
      NEXT_PUBLIC_APP_NAME: "Piano Habit Tracker",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      DATABASE_URL: "postgresql://piano:piano@localhost:5432/piano_test",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/*.d.ts",
        // Generated shadcn/ui primitives are not our code to test.
        "src/components/ui/**",
        // Generated Prisma client.
        "src/generated/**",
        // Pages and layouts are covered by the Playwright end-to-end tests.
        "src/app/**",
        "src/instrumentation.ts",
        // Thin wrapper around the database driver, covered by the E2E health check.
        "src/server/db.ts",
      ],
    },
  },
});
