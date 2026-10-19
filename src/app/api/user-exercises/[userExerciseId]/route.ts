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
  updateUserExerciseSchema,
  userExerciseParamsSchema,
} from "@/server/exercises/schemas";
import {
  deleteUserExercise,
  updateUserExercise,
} from "@/server/exercises/user-exercises";
import { deleteQuerySchema } from "@/server/tracking/shared";

type Context = { params: Promise<{ userExerciseId: string }> };

export const PATCH = apiHandler(
  async (request: Request, { params }: Context) => {
    const user = await requireUser();
    const { userExerciseId } = parseWithSchema(
      userExerciseParamsSchema,
      await params,
    );
    const input = await parseJsonBody(request, updateUserExerciseSchema);

    return ok(await updateUserExercise(user.id, userExerciseId, input));
  },
);

export const DELETE = apiHandler(
  async (request: Request, { params }: Context) => {
    const user = await requireUser();
    const { userExerciseId } = parseWithSchema(
      userExerciseParamsSchema,
      await params,
    );
    const { confirm } = parseSearchParams(request, deleteQuerySchema);

    await deleteUserExercise(user.id, userExerciseId, confirm === "true");

    return noContent();
  },
);
