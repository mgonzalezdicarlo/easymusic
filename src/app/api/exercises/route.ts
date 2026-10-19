import {
  apiHandler,
  created,
  paginated,
  parseJsonBody,
  parseSearchParams,
} from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import {
  createCustomExercise,
  listExercises,
} from "@/server/exercises/exercises";
import {
  createExerciseSchema,
  listExercisesQuerySchema,
} from "@/server/exercises/schemas";

export const GET = apiHandler(async (request) => {
  const user = await requireUser();
  const query = parseSearchParams(request, listExercisesQuerySchema);
  const { items, total } = await listExercises(user.id, query);

  return paginated(items, query, total);
});

export const POST = apiHandler(async (request) => {
  const user = await requireUser();
  const input = await parseJsonBody(request, createExerciseSchema);

  return created(await createCustomExercise(user.id, input));
});
