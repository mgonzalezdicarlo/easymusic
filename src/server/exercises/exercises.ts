import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";
import { toSkipTake } from "@/server/api/pagination";
import { prisma } from "@/server/db";
import {
  ownedExercisesWhere,
  visibleExercisesWhere,
} from "@/server/exercises/access";
import type {
  CreateExerciseInput,
  ListExercisesQuery,
  UpdateExerciseInput,
} from "@/server/exercises/schemas";
import {
  assertDeleteConfirmed,
  prismaErrorCode,
  RECORD_NOT_FOUND,
  UNIQUE_VIOLATION,
} from "@/server/tracking/shared";

const NOT_FOUND = "Exercise not found.";
const DUPLICATE = "You already have an exercise with this source and number.";

/** Public shape of an exercise. The owner is not exposed: `source` tells catalog from custom. */
export const exerciseSelect = {
  id: true,
  source: true,
  number: true,
  title: true,
  description: true,
  targetBpm: true,
} satisfies Prisma.ExerciseSelect;

function toWriteError(error: unknown): unknown {
  const code = prismaErrorCode(error);

  if (code === UNIQUE_VIOLATION) return ApiError.conflict(DUPLICATE);
  if (code === RECORD_NOT_FOUND) return ApiError.notFound(NOT_FOUND);

  return error;
}

/** A numeric search also matches the exercise number. Titles match case-insensitively. */
function searchFilter(search: string): Prisma.ExerciseWhereInput {
  const clauses: Prisma.ExerciseWhereInput[] = [
    { title: { contains: search, mode: "insensitive" } },
  ];

  if (/^\d{1,9}$/.test(search)) clauses.push({ number: Number(search) });

  return { OR: clauses };
}

/**
 * Proves the exercise is visible to the user and that they may change it.
 * Other users' exercises are 404. Catalog exercises are visible but read-only (403).
 */
async function assertEditable(userId: string, id: string) {
  const exercise = await prisma.exercise.findFirst({
    where: { id, ...visibleExercisesWhere(userId) },
    select: { ownerId: true },
  });

  if (!exercise) throw ApiError.notFound(NOT_FOUND);

  if (exercise.ownerId === null) {
    throw ApiError.forbidden("Catalog exercises are read-only.");
  }
}

/** The shared catalog plus the user's own exercises. */
export async function listExercises(userId: string, query: ListExercisesQuery) {
  const filters: Prisma.ExerciseWhereInput[] = [visibleExercisesWhere(userId)];

  if (query.source) filters.push({ source: query.source });
  if (query.search) filters.push(searchFilter(query.search));

  const where: Prisma.ExerciseWhereInput = { AND: filters };

  const [items, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      select: exerciseSelect,
      orderBy: [
        { source: "asc" },
        { number: { sort: "asc", nulls: "last" } },
        { title: "asc" },
        { id: "asc" },
      ],
      ...toSkipTake(query),
    }),
    prisma.exercise.count({ where }),
  ]);

  return { items, total };
}

export async function createCustomExercise(
  userId: string,
  input: CreateExerciseInput,
) {
  try {
    return await prisma.exercise.create({
      data: {
        ownerId: userId,
        source: input.source,
        title: input.title,
        number: input.number,
        description: input.description,
        targetBpm: input.targetBpm,
      },
      select: exerciseSelect,
    });
  } catch (error) {
    throw toWriteError(error);
  }
}

export async function updateCustomExercise(
  userId: string,
  id: string,
  input: UpdateExerciseInput,
) {
  await assertEditable(userId, id);

  try {
    return await prisma.exercise.update({
      where: { id, ...ownedExercisesWhere(userId) },
      data: {
        source: input.source,
        title: input.title,
        number: input.number,
        description: input.description,
        targetBpm: input.targetBpm,
      },
      select: exerciseSelect,
    });
  } catch (error) {
    throw toWriteError(error);
  }
}

/** Tracking and practice history are removed with the exercise (ON DELETE CASCADE). */
export async function deleteCustomExercise(
  userId: string,
  id: string,
  confirmed: boolean,
) {
  await assertEditable(userId, id);

  const entries = await prisma.exercisePracticeEntry.count({
    where: { userExercise: { exerciseId: id } },
  });

  assertDeleteConfirmed(confirmed, entries, "This exercise");

  const { count } = await prisma.exercise.deleteMany({
    where: { id, ...ownedExercisesWhere(userId) },
  });

  if (count === 0) throw ApiError.notFound(NOT_FOUND);
}
