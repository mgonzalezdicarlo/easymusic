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

  it("rejects a BETTER_AUTH_SECRET that is too short", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "too-short");

    await expect(loadServerEnv()).rejects.toThrow(/BETTER_AUTH_SECRET/);
  });

  it("requires the GitHub client id and secret together", async () => {
    vi.stubEnv("GITHUB_CLIENT_ID", "id");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "");

    await expect(loadServerEnv()).rejects.toThrow(/GITHUB_CLIENT_SECRET/);
  });

  it("treats blank GitHub settings as not configured", async () => {
    vi.stubEnv("GITHUB_CLIENT_ID", "");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "");

    const { serverEnv } = await loadServerEnv();

    expect(serverEnv.GITHUB_CLIENT_ID).toBeUndefined();
  });
});
