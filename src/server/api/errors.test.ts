// @vitest-environment node
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ApiError, fieldErrorsFromZod } from "@/server/api/errors";

describe("ApiError", () => {
  it.each([
    [ApiError.badRequest(), 400, "BAD_REQUEST"],
    [ApiError.validation([]), 400, "VALIDATION_ERROR"],
    [ApiError.unauthorized(), 401, "UNAUTHORIZED"],
    [ApiError.forbidden(), 403, "FORBIDDEN"],
    [ApiError.notFound(), 404, "NOT_FOUND"],
    [ApiError.conflict(), 409, "CONFLICT"],
    [ApiError.internal(), 500, "INTERNAL_ERROR"],
  ])("%s has status %i and code %s", (error, status, code) => {
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
  });

  it("accepts a custom message", () => {
    expect(ApiError.notFound("Scale not found.").message).toBe(
      "Scale not found.",
    );
  });
});

describe("fieldErrorsFromZod", () => {
  it("maps issues to dot-separated paths and messages", () => {
    const schema = z.object({
      name: z.string().min(3),
      items: z.array(z.object({ bpm: z.number() })),
    });
    const result = schema.safeParse({ name: "x", items: [{ bpm: "fast" }] });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(fieldErrorsFromZod(result.error)).toEqual(
      expect.arrayContaining([
        { path: "name", message: expect.any(String) },
        { path: "items.0.bpm", message: expect.any(String) },
      ]),
    );
  });

  it("uses an empty path for root-level issues", () => {
    const result = z.string().safeParse(1);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(fieldErrorsFromZod(result.error)).toEqual([
      { path: "", message: expect.any(String) },
    ]);
  });
});
