import type { z } from "zod";

import { ApiError, fieldErrorsFromZod } from "@/server/api/errors";

/** Parses `data` with `schema`, or throws a 400 `ApiError` listing every invalid field. */
export function parseWithSchema<S extends z.ZodType>(
  schema: S,
  data: unknown,
): z.output<S> {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw ApiError.validation(fieldErrorsFromZod(result.error));
  }

  return result.data;
}

/** Reads and validates a JSON request body. Malformed or empty JSON is a 400 `BAD_REQUEST`. */
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<z.output<S>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw ApiError.badRequest("Request body must be valid JSON.");
  }

  return parseWithSchema(schema, body);
}

/** Validates the query string. Repeated keys keep the last value. Use `z.coerce` for numbers. */
export function parseSearchParams<S extends z.ZodType>(
  request: Request,
  schema: S,
): z.output<S> {
  const { searchParams } = new URL(request.url);

  return parseWithSchema(schema, Object.fromEntries(searchParams));
}
