import {
  apiHandler,
  created,
  parseJsonBody,
  parseWithSchema,
} from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { addExerciseEntry } from "@/server/sessions/entries";
import {
  createExerciseEntrySchema,
  sessionParamsSchema,
} from "@/server/sessions/schemas";

type Context = { params: Promise<{ sessionId: string }> };

export const POST = apiHandler(
  async (request: Request, { params }: Context) => {
    const user = await requireUser();
    const { sessionId } = parseWithSchema(sessionParamsSchema, await params);
    const input = await parseJsonBody(request, createExerciseEntrySchema);

    return created(await addExerciseEntry(user.id, sessionId, input));
  },
);
