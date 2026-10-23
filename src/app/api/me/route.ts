import {
  apiHandler,
  noContent,
  ok,
  parseJsonBody,
  parseSearchParams,
} from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import {
  deleteAccount,
  getProfile,
  updateProfile,
} from "@/server/users/profile";
import {
  deleteAccountQuerySchema,
  updateProfileSchema,
} from "@/server/users/schemas";

export const GET = apiHandler(async () => {
  const user = await requireUser();

  return ok(await getProfile(user.id));
});

export const PATCH = apiHandler(async (request) => {
  const user = await requireUser();
  const input = await parseJsonBody(request, updateProfileSchema);

  return ok(await updateProfile(user.id, input));
});

export const DELETE = apiHandler(async (request) => {
  const user = await requireUser();

  parseSearchParams(request, deleteAccountQuerySchema);
  await deleteAccount(user.id);

  return noContent();
});
