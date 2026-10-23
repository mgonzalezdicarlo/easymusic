import { redirect } from "next/navigation";

import { ApiError } from "@/server/api/errors";
import {
  type AuthenticatedUser,
  requireUser,
} from "@/server/auth/require-user";

/** Like `requireUser`, for server-rendered pages: no session means a redirect to sign-in. */
export async function requirePageUser(): Promise<AuthenticatedUser> {
  try {
    return await requireUser();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/sign-in");
    }

    throw error;
  }
}
