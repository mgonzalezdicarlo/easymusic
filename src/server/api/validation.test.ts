// @vitest-environment node
import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  parseJsonBody,
  parseSearchParams,
  parseWithSchema,
} from "@/server/api/validation";

const schema = z.object({ name: z.string().min(1), bpm: z.coerce.number() });

function catchError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error("Expected the function to throw.");
}

describe("parseWithSchema", () => {
  it("returns the parsed value", () => {
    expect(parseWithSchema(schema, { name: "C major", bpm: "80" })).toEqual({
      name: "C major",
      bpm: 80,
    });
  });

  it("throws a 400 validation error with every invalid field", () => {
    expect(
      catchError(() => parseWithSchema(schema, { name: "" })),
    ).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      fields: [
        { path: "name", message: expect.any(String) },
        { path: "bpm", message: expect.any(String) },
      ],
    });
  });
});

describe("parseJsonBody", () => {
  function post(body: string) {
    return new Request("http://localhost/api/test", { method: "POST", body });
  }

  it("parses and validates a JSON body", async () => {
    await expect(
      parseJsonBody(post('{"name":"A minor","bpm":90}'), schema),
    ).resolves.toEqual({ name: "A minor", bpm: 90 });
  });

  it("rejects malformed JSON with BAD_REQUEST", async () => {
    await expect(parseJsonBody(post("{nope"), schema)).rejects.toMatchObject({
      status: 400,
      code: "BAD_REQUEST",
    });
  });

  it("rejects an empty body with BAD_REQUEST", async () => {
    await expect(parseJsonBody(post(""), schema)).rejects.toMatchObject({
      status: 400,
      code: "BAD_REQUEST",
    });
  });

  it("rejects a body that fails the schema with field messages", async () => {
    await expect(
      parseJsonBody(post('{"bpm":"fast"}'), schema),
    ).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      fields: [
        { path: "name", message: expect.any(String) },
        { path: "bpm", message: expect.any(String) },
      ],
    });
  });
});

describe("parseSearchParams", () => {
  it("validates and coerces query parameters", () => {
    const request = new Request("http://localhost/api/test?name=D&bpm=100");

    expect(parseSearchParams(request, schema)).toEqual({ name: "D", bpm: 100 });
  });

  it("throws a validation error for invalid query parameters", () => {
    const request = new Request("http://localhost/api/test?name=D&bpm=abc");

    expect(catchError(() => parseSearchParams(request, schema))).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      fields: [{ path: "bpm", message: expect.any(String) }],
    });
  });
});
