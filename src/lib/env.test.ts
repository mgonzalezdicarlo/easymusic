import { describe, expect, it, vi } from "vitest";

async function loadEnvModule() {
  vi.resetModules();
  return import("@/lib/env");
}

describe("env", () => {
  it("parses valid environment variables", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "Test App");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");

    const { env } = await loadEnvModule();

    expect(env.NEXT_PUBLIC_APP_NAME).toBe("Test App");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("https://example.com");
    expect(env.NODE_ENV).toBe("test");
  });

  it("fails fast with a clear message when the app URL is invalid", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "not-a-url");

    await expect(loadEnvModule()).rejects.toThrow(
      /Invalid or missing environment variables/,
    );
    await expect(loadEnvModule()).rejects.toThrow(/NEXT_PUBLIC_APP_URL/);
  });

  it("fails fast when the app name is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "");

    await expect(loadEnvModule()).rejects.toThrow(/NEXT_PUBLIC_APP_NAME/);
  });
});
