import {
  apiHandler,
  created,
  paginated,
  parseJsonBody,
  parseSearchParams,
} from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import {
  createUserExerciseSchema,
  listUserExercisesQuerySchema,
} from "@/server/exercises/schemas";
import {
  createUserExercise,
  listUserExercises,
} from "@/server/exercises/user-exercises";

export const GET = apiHandler(async (request) => {
  const user = await requireUser();
  const query = parseSearchParams(request, listUserExercisesQuerySchema);
  const { items, total } = await listUserExercises(user.id, query);

  return paginated(items, query, total);
});

export const POST = apiHandler(async (request) => {
  const user = await requireUser();
  const input = await parseJsonBody(request, createUserExerciseSchema);

  return created(await createUserExercise(user.id, input));
});
