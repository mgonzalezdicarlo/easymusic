import { headers } from "next/headers";

import { ApiError } from "@/server/api/errors";
import { auth } from "@/server/auth/auth";

export type AuthenticatedUser = { id: string };

/**
 * Returns the signed-in user, or rejects with a 401 `ApiError` (ADR-0004). The session is
 * read from the request cookies and checked against the database on every call.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) throw ApiError.unauthorized();

  return { id: session.user.id };
}
