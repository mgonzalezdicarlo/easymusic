// @vitest-environment node
import { describe, expect, it } from "vitest";

import { requireUser } from "@/server/auth/require-user";

describe("requireUser (stub until E3-01)", () => {
  it("rejects with a 401 ApiError", async () => {
    await expect(requireUser()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });
});
