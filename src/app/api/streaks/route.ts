import { apiHandler, ok } from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { getStreakSummary } from "@/server/streaks/service";

export const GET = apiHandler(async () => {
  const user = await requireUser();

  return ok(await getStreakSummary(user.id));
});
