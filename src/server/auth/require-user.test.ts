// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { auth } from "@/server/auth/auth";
import { requireUser } from "@/server/auth/require-user";

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));
vi.mock("@/server/auth/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

const getSession = vi.mocked(auth.api.getSession);

describe("requireUser", () => {
  it("returns the id of the signed-in user", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } } as never);

    await expect(requireUser()).resolves.toEqual({ id: "user-1" });
  });

  it("rejects with a 401 ApiError when there is no session", async () => {
    getSession.mockResolvedValue(null);

    await expect(requireUser()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });
});
