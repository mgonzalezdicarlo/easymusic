// @vitest-environment node
import { describe, expect, it } from "vitest";

import { ApiError } from "@/server/api/errors";
import { created, errorResponse, noContent, ok } from "@/server/api/response";

describe("success responses", () => {
  it("wraps the payload in data with status 200", async () => {
    const response = ok({ id: "1" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id: "1" } });
  });

  it("returns 201 for created resources", async () => {
    const response = created({ id: "1" });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: { id: "1" } });
  });

  it("returns 204 with no body", async () => {
    const response = noContent();

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });
});

describe("errorResponse", () => {
  it("includes field messages for validation errors", async () => {
    const response = errorResponse(
      ApiError.validation([{ path: "cleanBpm", message: "Too small" }]),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input.",
        fields: [{ path: "cleanBpm", message: "Too small" }],
      },
    });
  });

  it("omits fields for other errors", async () => {
    const response = errorResponse(ApiError.notFound("Scale not found."));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Scale not found." },
    });
  });
});
