import { apiHandler, paginated, parseSearchParams } from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { listScales } from "@/server/scales/scales";
import { listScalesQuerySchema } from "@/server/scales/schemas";

export const GET = apiHandler(async (request) => {
  await requireUser();
  const query = parseSearchParams(request, listScalesQuerySchema);
  const { items, total } = await listScales(query);

  return paginated(items, query, total);
});
