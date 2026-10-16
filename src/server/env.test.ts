import { describe, expect, it, vi } from "vitest";

async function loadServerEnv() {
  vi.resetModules();
  return import("@/server/env");
}

describe("serverEnv", () => {
  it("parses a valid PostgreSQL connection string", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");

    const { serverEnv } = await loadServerEnv();

    expect(serverEnv.DATABASE_URL).toBe(
      "postgresql://user:pass@localhost:5432/db",
    );
  });

  it("accepts the postgres:// scheme", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost:5432/db");

    const { serverEnv } = await loadServerEnv();

    expect(serverEnv.DATABASE_URL).toBe(
      "postgres://user:pass@localhost:5432/db",
    );
  });

  it("fails fast with a clear message when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");

    await expect(loadServerEnv()).rejects.toThrow(
      /Invalid or missing server environment variables/,
    );
    await expect(loadServerEnv()).rejects.toThrow(/DATABASE_URL/);
  });

  it("rejects a connection string for another database", async () => {
    vi.stubEnv("DATABASE_URL", "mysql://user:pass@localhost:3306/db");

    await expect(loadServerEnv()).rejects.toThrow(
      /PostgreSQL connection string/,
    );
  });
});
