export const GENERIC_ERROR = "Something went wrong. Please try again.";

/** A user-facing message for an error returned by the Better Auth client. */
export function authErrorMessage(error: { status: number; message?: string }) {
  if (error.status === 429) {
    return "Too many attempts. Wait a minute and try again.";
  }

  if (error.status >= 500) return GENERIC_ERROR;

  return error.message || GENERIC_ERROR;
}
