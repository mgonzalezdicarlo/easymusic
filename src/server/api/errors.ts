import type { ZodError } from "zod";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

/** One invalid input field. `path` is dot-separated ("items.0.bpm"); "" means the whole value. */
export type FieldError = { path: string; message: string };

/**
 * An error that is safe to show to the client. Throw it anywhere inside an `apiHandler`
 * and it becomes the matching HTTP response. Any other error becomes a generic 500.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fields?: readonly FieldError[];

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    fields?: readonly FieldError[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static badRequest(message = "Bad request.") {
    return new ApiError(400, "BAD_REQUEST", message);
  }

  static validation(fields: readonly FieldError[], message = "Invalid input.") {
    return new ApiError(400, "VALIDATION_ERROR", message, fields);
  }

  static unauthorized(message = "Authentication required.") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "You do not have access to this resource.") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found.") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message = "The request conflicts with existing data.") {
    return new ApiError(409, "CONFLICT", message);
  }

  static internal() {
    return new ApiError(500, "INTERNAL_ERROR", "Internal server error.");
  }
}

export function fieldErrorsFromZod(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
}
