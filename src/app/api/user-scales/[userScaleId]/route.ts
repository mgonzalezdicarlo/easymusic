import {
  apiHandler,
  noContent,
  ok,
  parseJsonBody,
  parseSearchParams,
  parseWithSchema,
} from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { deleteUserScale, updateUserScale } from "@/server/scales/scales";
import {
  updateUserScaleSchema,
  userScaleParamsSchema,
} from "@/server/scales/schemas";
import { deleteQuerySchema } from "@/server/tracking/shared";

type Context = { params: Promise<{ userScaleId: string }> };

export const PATCH = apiHandler(
  async (request: Request, { params }: Context) => {
    const user = await requireUser();
    const { userScaleId } = parseWithSchema(
      userScaleParamsSchema,
      await params,
    );
    const input = await parseJsonBody(request, updateUserScaleSchema);

    return ok(await updateUserScale(user.id, userScaleId, input));
  },
);

export const DELETE = apiHandler(
  async (request: Request, { params }: Context) => {
    const user = await requireUser();
    const { userScaleId } = parseWithSchema(
      userScaleParamsSchema,
      await params,
    );
    const { confirm } = parseSearchParams(request, deleteQuerySchema);

    await deleteUserScale(user.id, userScaleId, confirm === "true");

    return noContent();
  },
);
