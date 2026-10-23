// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "@/proxy";
import { auth } from "@/server/auth/auth";

vi.mock("@/server/auth/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

const getSession = vi.mocked(auth.api.getSession);

function visit(path: string) {
  return proxy(new NextRequest(`http://localhost:3000${path}`));
}

beforeEach(() => {
  getSession.mockReset();
});

describe("proxy", () => {
  it.each([
    "/dashboard",
    "/scales",
    "/scales/c-major",
    "/exercises",
    "/analytics",
    "/settings",
  ])("redirects a signed-out visitor from %s to /sign-in", async (path) => {
    getSession.mockResolvedValue(null);

    const response = await visit(path);

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
      "/sign-in",
    );
  });

  it("lets a signed-in user through", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } } as never);

    const response = await visit("/settings");

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it.each(["/", "/sign-in", "/sign-up"])(
    "keeps %s public without checking the session",
    async (path) => {
      const response = await visit(path);

      expect(response.status).toBe(200);
      expect(getSession).not.toHaveBeenCalled();
    },
  );
});
