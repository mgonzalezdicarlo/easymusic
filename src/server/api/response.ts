import { NextResponse } from "next/server";

import {
  type ApiError,
  type ApiErrorCode,
  type FieldError,
} from "@/server/api/errors";

/** Every successful JSON response wraps its payload in `data`. */
export type ApiSuccessBody<T> = { data: T };

/** Every error response has this shape. `fields` is present only for validation errors. */
export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: readonly FieldError[];
  };
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccessBody<T>>({ data }, init);
}

export function created<T>(data: T) {
  return ok(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(error: ApiError) {
  return NextResponse.json<ApiErrorBody>(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    },
    { status: error.status },
  );
}
