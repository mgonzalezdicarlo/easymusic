import {
  apiHandler,
  noContent,
  ok,
  parseJsonBody,
  parseWithSchema,
} from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import {
  sessionParamsSchema,
  updateSessionSchema,
} from "@/server/sessions/schemas";
import {
  deleteSession,
  getSession,
  updateSession,
} from "@/server/sessions/sessions";

type Context = { params: Promise<{ sessionId: string }> };

export const GET = apiHandler(
  async (_request: Request, { params }: Context) => {
    const user = await requireUser();
    const { sessionId } = parseWithSchema(sessionParamsSchema, await params);

    return ok(await getSession(user.id, sessionId));
  },
);

export const PATCH = apiHandler(
  async (request: Request, { params }: Context) => {
    const user = await requireUser();
    const { sessionId } = parseWithSchema(sessionParamsSchema, await params);
    const input = await parseJsonBody(request, updateSessionSchema);

    return ok(await updateSession(user.id, sessionId, input));
  },
);

export const DELETE = apiHandler(
  async (_request: Request, { params }: Context) => {
    const user = await requireUser();
    const { sessionId } = parseWithSchema(sessionParamsSchema, await params);

    await deleteSession(user.id, sessionId);

    return noContent();
  },
);
