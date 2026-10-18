// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  buildPaginationMeta,
  MAX_PAGE_SIZE,
  paginated,
  paginationQuerySchema,
  toSkipTake,
} from "@/server/api/pagination";
import { parseWithSchema } from "@/server/api/validation";

describe("paginationQuerySchema", () => {
  it("applies defaults", () => {
    expect(parseWithSchema(paginationQuerySchema, {})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it("coerces query-string values", () => {
    expect(
      parseWithSchema(paginationQuerySchema, { page: "3", pageSize: "50" }),
    ).toEqual({ page: 3, pageSize: 50 });
  });

  it.each([
    [{ page: "0" }, "page"],
    [{ page: "abc" }, "page"],
    [{ page: "1.5" }, "page"],
    [{ pageSize: "0" }, "pageSize"],
    [{ pageSize: String(MAX_PAGE_SIZE + 1) }, "pageSize"],
  ])("rejects %j", (input, path) => {
    expect(() => parseWithSchema(paginationQuerySchema, input)).toThrowError(
      expect.objectContaining({
        status: 400,
        fields: [{ path, message: expect.any(String) }],
      }),
    );
  });
});

describe("toSkipTake", () => {
  it("computes the offset from a 1-based page", () => {
    expect(toSkipTake({ page: 1, pageSize: 20 })).toEqual({
      skip: 0,
      take: 20,
    });
    expect(toSkipTake({ page: 3, pageSize: 20 })).toEqual({
      skip: 40,
      take: 20,
    });
  });
});

describe("buildPaginationMeta", () => {
  it("rounds the page count up", () => {
    expect(buildPaginationMeta({ page: 1, pageSize: 20 }, 41)).toEqual({
      page: 1,
      pageSize: 20,
      total: 41,
      totalPages: 3,
    });
  });

  it("reports zero pages when there are no results", () => {
    expect(buildPaginationMeta({ page: 1, pageSize: 20 }, 0).totalPages).toBe(
      0,
    );
  });
});

describe("paginated", () => {
  it("returns data and pagination metadata", async () => {
    const response = paginated(["a", "b"], { page: 2, pageSize: 2 }, 5);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: ["a", "b"],
      pagination: { page: 2, pageSize: 2, total: 5, totalPages: 3 },
    });
  });
});
