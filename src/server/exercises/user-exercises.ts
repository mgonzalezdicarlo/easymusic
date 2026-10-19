import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";
import { toSkipTake } from "@/server/api/pagination";
import { prisma } from "@/server/db";
import { visibleExercisesWhere } from "@/server/exercises/access";
import { exerciseSelect } from "@/server/exercises/exercises";
import type {
  CreateUserExerciseInput,
  ListUserExercisesQuery,
  UpdateUserExerciseInput,
} from "@/server/exercises/schemas";
import {
  assertDeleteConfirmed,
  prismaErrorCode,
  RECORD_NOT_FOUND,
  UNIQUE_VIOLATION,
} from "@/server/tracking/shared";

const NOT_FOUND = "Tracked exercise not found.";
const DUPLICATE = "You already track this exercise.";

const userExerciseSelect = {
  id: true,
  exerciseId: true,
  targetBpm: true,
  status: true,
  createdAt: true,
  exercise: { select: exerciseSelect },
} satisfies Prisma.UserExerciseSelect;

function toWriteError(error: unknown): unknown {
  const code = prismaErrorCode(error);

  if (code === UNIQUE_VIOLATION) return ApiError.conflict(DUPLICATE);
  if (code === RECORD_NOT_FOUND) return ApiError.notFound(NOT_FOUND);

  return error;
}

export async function listUserExercises(
  userId: string,
  query: ListUserExercisesQuery,
) {
  const where = { userId, status: query.status };

  const [items, total] = await Promise.all([
    prisma.userExercise.findMany({
      where,
      select: userExerciseSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...toSkipTake(query),
    }),
    prisma.userExercise.count({ where }),
  ]);

  return { items, total };
}

/** The exercise must be in the shared catalog or owned by the user. */
export async function createUserExercise(
  userId: string,
  input: CreateUserExerciseInput,
) {
  const exercise = await prisma.exercise.findFirst({
    where: { id: input.exerciseId, ...visibleExercisesWhere(userId) },
    select: { id: true },
  });

  if (!exercise) throw ApiError.notFound("Exercise not found.");

  try {
    return await prisma.userExercise.create({
      data: { userId, exerciseId: exercise.id, targetBpm: input.targetBpm },
      select: userExerciseSelect,
    });
  } catch (error) {
    throw toWriteError(error);
  }
}

export async function updateUserExercise(
  userId: string,
  id: string,
  input: UpdateUserExerciseInput,
) {
  try {
    return await prisma.userExercise.update({
      where: { id, userId },
      data: { targetBpm: input.targetBpm, status: input.status },
      select: userExerciseSelect,
    });
  } catch (error) {
    throw toWriteError(error);
  }
}

/** Practice entries are removed with the tracked exercise (ON DELETE CASCADE). */
export async function deleteUserExercise(
  userId: string,
  id: string,
  confirmed: boolean,
) {
  const tracked = await prisma.userExercise.findFirst({
    where: { id, userId },
    select: { _count: { select: { entries: true } } },
  });

  if (!tracked) throw ApiError.notFound(NOT_FOUND);

  assertDeleteConfirmed(
    confirmed,
    tracked._count.entries,
    "This tracked exercise",
  );

  const { count } = await prisma.userExercise.deleteMany({
    where: { id, userId },
  });

  if (count === 0) throw ApiError.notFound(NOT_FOUND);
}
