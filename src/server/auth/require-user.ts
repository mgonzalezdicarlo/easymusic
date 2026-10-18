import { ApiError } from "@/server/api/errors";

export type AuthenticatedUser = { id: string };

/**
 * Returns the signed-in user, or rejects with a 401 `ApiError`.
 *
 * Stub until E3-01 wires up Better Auth (ADR-0004). It fails closed: no request counts as
 * authenticated yet, so a route that calls it can never leak data by accident. E3-01 replaces
 * the body and keeps this signature.
 */
export function requireUser(): Promise<AuthenticatedUser> {
  return Promise.reject(ApiError.unauthorized());
}
