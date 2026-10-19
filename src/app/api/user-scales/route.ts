import {
  apiHandler,
  created,
  paginated,
  parseJsonBody,
  parseSearchParams,
} from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { createUserScale, listUserScales } from "@/server/scales/scales";
import {
  createUserScaleSchema,
  listUserScalesQuerySchema,
} from "@/server/scales/schemas";

export const GET = apiHandler(async (request) => {
  const user = await requireUser();
  const query = parseSearchParams(request, listUserScalesQuerySchema);
  const { items, total } = await listUserScales(user.id, query);

  return paginated(items, query, total);
});

export const POST = apiHandler(async (request) => {
  const user = await requireUser();
  const input = await parseJsonBody(request, createUserScaleSchema);

  return created(await createUserScale(user.id, input));
});
