import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";
import { toSkipTake } from "@/server/api/pagination";
import { prisma } from "@/server/db";
import type {
  CreateUserScaleInput,
  ListScalesQuery,
  ListUserScalesQuery,
  UpdateUserScaleInput,
} from "@/server/scales/schemas";
import {
  assertDeleteConfirmed,
  prismaErrorCode,
  RECORD_NOT_FOUND,
  UNIQUE_VIOLATION,
} from "@/server/tracking/shared";

const NOT_FOUND = "Tracked scale not found.";
const DUPLICATE =
  "You already track this scale with the same octaves and hands mode.";

const userScaleSelect = {
  id: true,
  scaleId: true,
  octaves: true,
  handsMode: true,
  targetBpm: true,
  status: true,
  createdAt: true,
  scale: { select: { id: true, tonic: true, mode: true } },
} satisfies Prisma.UserScaleSelect;

/** Maps database errors to API errors. Anything else is rethrown and becomes a generic 500. */
function toWriteError(error: unknown): unknown {
  const code = prismaErrorCode(error);

  if (code === UNIQUE_VIOLATION) return ApiError.conflict(DUPLICATE);
  if (code === RECORD_NOT_FOUND) return ApiError.notFound(NOT_FOUND);

  return error;
}

/** The shared, read-only catalog. Ordered by mode (enum order), then tonic. */
export async function listScales(query: ListScalesQuery) {
  const where = { tonic: query.tonic, mode: query.mode };

  const [items, total] = await Promise.all([
    prisma.scale.findMany({
      where,
      select: { id: true, tonic: true, mode: true },
      orderBy: [{ mode: "asc" }, { tonic: "asc" }],
      ...toSkipTake(query),
    }),
    prisma.scale.count({ where }),
  ]);

  return { items, total };
}

export async function listUserScales(
  userId: string,
  query: ListUserScalesQuery,
) {
  const where = { userId, status: query.status };

  const [items, total] = await Promise.all([
    prisma.userScale.findMany({
      where,
      select: userScaleSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...toSkipTake(query),
    }),
    prisma.userScale.count({ where }),
  ]);

  return { items, total };
}

export async function createUserScale(
  userId: string,
  input: CreateUserScaleInput,
) {
  const scale = await prisma.scale.findUnique({
    where: { id: input.scaleId },
    select: { id: true },
  });

  if (!scale) throw ApiError.notFound("Scale not found.");

  try {
    return await prisma.userScale.create({
      data: {
        userId,
        scaleId: scale.id,
        octaves: input.octaves,
        handsMode: input.handsMode,
        targetBpm: input.targetBpm,
      },
      select: userScaleSelect,
    });
  } catch (error) {
    throw toWriteError(error);
  }
}

export async function updateUserScale(
  userId: string,
  id: string,
  input: UpdateUserScaleInput,
) {
  try {
    return await prisma.userScale.update({
      where: { id, userId },
      data: {
        octaves: input.octaves,
        handsMode: input.handsMode,
        targetBpm: input.targetBpm,
        status: input.status,
      },
      select: userScaleSelect,
    });
  } catch (error) {
    throw toWriteError(error);
  }
}

/** Practice entries are removed with the tracked scale (ON DELETE CASCADE). */
export async function deleteUserScale(
  userId: string,
  id: string,
  confirmed: boolean,
) {
  const tracked = await prisma.userScale.findFirst({
    where: { id, userId },
    select: { _count: { select: { entries: true } } },
  });

  if (!tracked) throw ApiError.notFound(NOT_FOUND);

  assertDeleteConfirmed(
    confirmed,
    tracked._count.entries,
    "This tracked scale",
  );

  const { count } = await prisma.userScale.deleteMany({
    where: { id, userId },
  });

  if (count === 0) throw ApiError.notFound(NOT_FOUND);
}
