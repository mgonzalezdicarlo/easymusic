import { describe, expect, it } from "vitest";

import { isActivePath, navItems } from "@/components/layout/nav-items";

describe("isActivePath", () => {
  it("matches the exact path", () => {
    expect(isActivePath("/scales", "/scales")).toBe(true);
  });

  it("matches nested paths", () => {
    expect(isActivePath("/scales/c-major", "/scales")).toBe(true);
  });

  it("does not match a sibling path that shares the same prefix", () => {
    expect(isActivePath("/scales-archive", "/scales")).toBe(false);
  });

  it("does not match unrelated paths", () => {
    expect(isActivePath("/dashboard", "/scales")).toBe(false);
  });
});

describe("navItems", () => {
  it("defines the five main sections with unique routes and labels", () => {
    expect(navItems).toHaveLength(5);
    expect(new Set(navItems.map((item) => item.href)).size).toBe(
      navItems.length,
    );
    expect(new Set(navItems.map((item) => item.label)).size).toBe(
      navItems.length,
    );
  });
});
