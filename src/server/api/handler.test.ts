// @vitest-environment node
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ApiError, apiHandler, ok, parseJsonBody } from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { createLogger, type LogLevel } from "@/server/logger";

function testLogger() {
  const lines: Array<{ level: LogLevel; entry: Record<string, unknown> }> = [];
  const logger = createLogger(
    {},
    {
      minLevel: "debug",
      write: (level, line) => lines.push({ level, entry: JSON.parse(line) }),
    },
  );

  return { logger, lines };
}

describe("apiHandler", () => {
  it("returns the handler's response unchanged", async () => {
    const GET = apiHandler(() => ok({ hello: "world" }));

    const response = await GET(
      new Request("http://localhost/api/hello"),
      undefined,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { hello: "world" } });
  });

  it("passes the route context to the handler", async () => {
    const GET = apiHandler(
      async (_request, context: { params: Promise<{ id: string }> }) => {
        const { id } = await context.params;
        return ok({ id });
      },
    );

    const response = await GET(new Request("http://localhost/api/items/7"), {
      params: Promise.resolve({ id: "7" }),
    });

    expect(await response.json()).toEqual({ data: { id: "7" } });
  });

  it("answers invalid input with a 400 and field messages", async () => {
    const POST = apiHandler(async (request) => {
      const body = await parseJsonBody(
        request,
        z.object({ cleanBpm: z.number().int().min(20), maxBpm: z.number() }),
      );
      return ok(body);
    });

    const response = await POST(
      new Request("http://localhost/api/entries", {
        method: "POST",
        body: JSON.stringify({ cleanBpm: 5 }),
      }),
      undefined,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input.",
        fields: [
          { path: "cleanBpm", message: expect.any(String) },
          { path: "maxBpm", message: expect.any(String) },
        ],
      },
    });
  });

  it("maps thrown ApiErrors to their status", async () => {
    const GET = apiHandler(async () => {
      throw ApiError.notFound("Scale not found.");
    });

    const response = await GET(
      new Request("http://localhost/api/scales/x"),
      undefined,
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Scale not found." },
    });
  });

  it("answers unexpected errors with a generic 500 and logs the details", async () => {
    const { logger, lines } = testLogger();
    const GET = apiHandler(
      () => {
        throw new Error("connection to db-host:5432 refused");
      },
      { logger },
    );

    const response = await GET(
      new Request("http://localhost/api/boom?token=secret"),
      undefined,
    );
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(text).not.toContain("db-host");
    expect(JSON.parse(text)).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Internal server error." },
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      level: "error",
      entry: {
        message: "Unhandled API error",
        method: "GET",
        path: "/api/boom",
        error: { message: "connection to db-host:5432 refused" },
      },
    });
    expect(JSON.stringify(lines[0].entry)).not.toContain("secret");
  });

  it("answers 401 while requireUser is still a stub", async () => {
    const GET = apiHandler(async () => {
      await requireUser();
      return ok({});
    });

    const response = await GET(
      new Request("http://localhost/api/me"),
      undefined,
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "UNAUTHORIZED", message: "Authentication required." },
    });
  });
});
