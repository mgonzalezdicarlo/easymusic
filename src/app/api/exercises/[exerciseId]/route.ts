import {
  apiHandler,
  noContent,
  ok,
  parseJsonBody,
  parseSearchParams,
  parseWithSchema,
} from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import {
  deleteCustomExercise,
  updateCustomExercise,
} from "@/server/exercises/exercises";
import {
  exerciseParamsSchema,
  updateExerciseSchema,
} from "@/server/exercises/schemas";
import { deleteQuerySchema } from "@/server/tracking/shared";

type Context = { params: Promise<{ exerciseId: string }> };

export const PATCH = apiHandler(
  async (request: Request, { params }: Context) => {
    const user = await requireUser();
    const { exerciseId } = parseWithSchema(exerciseParamsSchema, await params);
    const input = await parseJsonBody(request, updateExerciseSchema);

    return ok(await updateCustomExercise(user.id, exerciseId, input));
  },
);

export const DELETE = apiHandler(
  async (request: Request, { params }: Context) => {
    const user = await requireUser();
    const { exerciseId } = parseWithSchema(exerciseParamsSchema, await params);
    const { confirm } = parseSearchParams(request, deleteQuerySchema);

    await deleteCustomExercise(user.id, exerciseId, confirm === "true");

    return noContent();
  },
);
