import { GENERIC_ERROR } from "@/features/auth/messages";

type ErrorBody = {
  error?: {
    message?: string;
    fields?: { path: string; message: string }[];
  };
};

export type ProfileUpdate = {
  name?: string;
  timezone?: string;
  dailyGoalMinutes?: number;
  completeOnboarding?: true;
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function send(path: string, init: RequestInit): Promise<void> {
  const response = await fetch(path, init);

  if (response.ok) return;

  const body = (await response.json().catch(() => null)) as ErrorBody | null;
  const fieldErrors: Record<string, string> = {};

  for (const { path: field, message } of body?.error?.fields ?? []) {
    if (!(field in fieldErrors)) fieldErrors[field] = message;
  }

  throw new ApiRequestError(
    response.status >= 500
      ? GENERIC_ERROR
      : (body?.error?.message ?? GENERIC_ERROR),
    response.status,
    fieldErrors,
  );
}

export function saveProfile(input: ProfileUpdate) {
  return send("/api/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteAccount() {
  return send("/api/me?confirm=true", { method: "DELETE" });
}

/** Splits a failed request into a form-level message and per-field messages. */
export function toFormFailure(error: unknown): {
  formError: string | null;
  fieldErrors: Record<string, string>;
} {
  if (error instanceof ApiRequestError) {
    const hasFields = Object.keys(error.fieldErrors).length > 0;

    return {
      formError: hasFields ? null : error.message,
      fieldErrors: error.fieldErrors,
    };
  }

  return { formError: GENERIC_ERROR, fieldErrors: {} };
}
