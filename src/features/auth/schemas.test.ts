// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  firstFieldErrors,
  signInSchema,
  signUpSchema,
} from "@/features/auth/schemas";

describe("signUpSchema", () => {
  const valid = {
    name: "  Ada  ",
    email: " ada@example.com ",
    password: "correct-horse",
  };

  it("trims the name and email", () => {
    expect(signUpSchema.parse(valid)).toEqual({
      name: "Ada",
      email: "ada@example.com",
      password: "correct-horse",
    });
  });

  it.each([
    [{ name: "   " }, "name"],
    [{ email: "nope" }, "email"],
    [{ password: "short" }, "password"],
    [{ password: "x".repeat(129) }, "password"],
  ])("rejects %j", (extra, field) => {
    const result = signUpSchema.safeParse({ ...valid, ...extra });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(firstFieldErrors(result.error)).toHaveProperty(field);
    }
  });
});

describe("signInSchema", () => {
  it("accepts an email and a password", () => {
    expect(
      signInSchema.safeParse({ email: "ada@example.com", password: "x" })
        .success,
    ).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({
      email: "ada@example.com",
      password: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(firstFieldErrors(result.error)).toHaveProperty("password");
    }
  });
});
