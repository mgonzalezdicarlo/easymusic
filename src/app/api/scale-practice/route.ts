import { apiHandler, created, parseJsonBody } from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { logScalePractice } from "@/server/scales/practice";
import { logScalePracticeSchema } from "@/server/scales/practice-schemas";

export const POST = apiHandler(async (request) => {
  const user = await requireUser();
  const input = await parseJsonBody(request, logScalePracticeSchema);

  return created(await logScalePractice(user.id, input));
});
