import { describe, expect, it } from "vitest";

import { isPublicPath } from "@/lib/route-access";

describe("isPublicPath", () => {
  it.each(["/", "/sign-in", "/sign-up", "/sign-in/"])("allows %s", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each([
    "/dashboard",
    "/scales",
    "/scales/c-major",
    "/exercises",
    "/analytics",
    "/settings",
    "/sign-in-archive",
    "/anything-new",
  ])("protects %s", (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});
