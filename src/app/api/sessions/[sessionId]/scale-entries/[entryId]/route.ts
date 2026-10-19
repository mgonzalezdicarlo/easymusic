import {
  apiHandler,
  noContent,
  ok,
  parseJsonBody,
  parseWithSchema,
} from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { deleteScaleEntry, updateScaleEntry } from "@/server/sessions/entries";
import {
  entryParamsSchema,
  updateEntrySchema,
} from "@/server/sessions/schemas";

type Context = { params: Promise<{ sessionId: string; entryId: string }> };

export const PATCH = apiHandler(
  async (request: Request, { params }: Context) => {
    const user = await requireUser();
    const { sessionId, entryId } = parseWithSchema(
      entryParamsSchema,
      await params,
    );
    const input = await parseJsonBody(request, updateEntrySchema);

    return ok(await updateScaleEntry(user.id, sessionId, entryId, input));
  },
);

export const DELETE = apiHandler(
  async (_request: Request, { params }: Context) => {
    const user = await requireUser();
    const { sessionId, entryId } = parseWithSchema(
      entryParamsSchema,
      await params,
    );

    await deleteScaleEntry(user.id, sessionId, entryId);

    return noContent();
  },
);
