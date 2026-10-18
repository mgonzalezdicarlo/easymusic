import type { NextResponse } from "next/server";

import { ApiError } from "@/server/api/errors";
import { type ApiErrorBody, errorResponse } from "@/server/api/response";
import { type Logger, logger as defaultLogger } from "@/server/logger";

export type ApiHandlerOptions = { logger?: Logger };

/**
 * Maps any thrown value to the standard error response. `ApiError`s below 500 are returned as
 * they are. Everything else is logged with its stack and answered with a generic 500, so
 * internals never reach the client. The query string is not logged.
 */
export function toErrorResponse(
  error: unknown,
  request: Request,
  log: Logger = defaultLogger,
): NextResponse<ApiErrorBody> {
  const context = {
    method: request.method,
    path: new URL(request.url).pathname,
  };

  if (error instanceof ApiError && error.status < 500) {
    log.debug("API request rejected", {
      ...context,
      status: error.status,
      code: error.code,
    });
    return errorResponse(error);
  }

  log.error("Unhandled API error", { ...context, error });
  return errorResponse(ApiError.internal());
}

/**
 * Wraps a route handler so thrown errors become standard error responses.
 * Use it for every exported route handler (GET, POST, ...).
 */
export function apiHandler<
  Req extends Request,
  Context,
  Result extends Response,
>(
  handler: (request: Req, context: Context) => Result | Promise<Result>,
  options: ApiHandlerOptions = {},
) {
  return async (
    request: Req,
    context: Context,
  ): Promise<Result | NextResponse<ApiErrorBody>> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error, request, options.logger);
    }
  };
}
