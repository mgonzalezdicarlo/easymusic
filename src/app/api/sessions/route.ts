import {
  apiHandler,
  created,
  paginated,
  parseJsonBody,
  parseSearchParams,
} from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import {
  createSessionSchema,
  listSessionsQuerySchema,
} from "@/server/sessions/schemas";
import { createSession, listSessions } from "@/server/sessions/sessions";

export const GET = apiHandler(async (request) => {
  const user = await requireUser();
  const query = parseSearchParams(request, listSessionsQuerySchema);
  const { items, total } = await listSessions(user.id, query);

  return paginated(items, query, total);
});

export const POST = apiHandler(async (request) => {
  const user = await requireUser();
  const input = await parseJsonBody(request, createSessionSchema);

  return created(await createSession(user.id, input));
});
