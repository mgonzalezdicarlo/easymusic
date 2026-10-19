import {
  apiHandler,
  created,
  parseJsonBody,
  parseWithSchema,
} from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { addScaleEntry } from "@/server/sessions/entries";
import {
  createScaleEntrySchema,
  sessionParamsSchema,
} from "@/server/sessions/schemas";

type Context = { params: Promise<{ sessionId: string }> };

export const POST = apiHandler(
  async (request: Request, { params }: Context) => {
    const user = await requireUser();
    const { sessionId } = parseWithSchema(sessionParamsSchema, await params);
    const input = await parseJsonBody(request, createScaleEntrySchema);

    return created(await addScaleEntry(user.id, sessionId, input));
  },
);
