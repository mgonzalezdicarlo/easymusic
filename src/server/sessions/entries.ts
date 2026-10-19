import { ApiError } from "@/server/api/errors";
import { prisma } from "@/server/db";
import { visibleExercisesWhere } from "@/server/exercises/access";
import {
  type CreateExerciseEntryInput,
  type CreateScaleEntryInput,
  MAX_MINUTES,
  TEMPO_ORDER_MESSAGE,
  type UpdateEntryInput,
} from "@/server/sessions/schemas";
import { type Db, lockOwnedSession } from "@/server/sessions/sessions";

/** An entry is reachable only through a session the user owns. */
function entryWhere(userId: string, sessionId: string, entryId: string) {
  return { id: entryId, sessionId, session: { userId } };
}

function assertTempoOrder(cleanBpm: number, maxBpm: number) {
  if (maxBpm < cleanBpm) {
    throw ApiError.validation([
      { path: "maxBpm", message: TEMPO_ORDER_MESSAGE },
    ]);
  }
}

/**
 * Session duration rule: with at least one entry, the session duration is the sum of the
 * entries' durations. With none, the stored (manual) value is kept. Returns the duration.
 */
async function syncSessionDuration(tx: Db, sessionId: string) {
  const scale = await tx.scalePracticeEntry.aggregate({
    where: { sessionId },
    _count: true,
    _sum: { durationMinutes: true },
  });
  const exercise = await tx.exercisePracticeEntry.aggregate({
    where: { sessionId },
    _count: true,
    _sum: { durationMinutes: true },
  });
  const session = await tx.practiceSession.findUniqueOrThrow({
    where: { id: sessionId },
    select: { durationMinutes: true },
  });

  if (scale._count + exercise._count === 0) return session.durationMinutes;

  const total =
    (scale._sum.durationMinutes ?? 0) + (exercise._sum.durationMinutes ?? 0);

  if (total > MAX_MINUTES) {
    throw ApiError.validation([
      {
        path: "durationMinutes",
        message: `The entries of a session cannot add up to more than ${MAX_MINUTES} minutes.`,
      },
    ]);
  }

  if (total !== session.durationMinutes) {
    await tx.practiceSession.update({
      where: { id: sessionId },
      data: { durationMinutes: total },
    });
  }

  return total;
}

export function addScaleEntry(
  userId: string,
  sessionId: string,
  input: CreateScaleEntryInput,
) {
  return prisma.$transaction(async (tx) => {
    await lockOwnedSession(tx, userId, sessionId);

    const userScale = await tx.userScale.findFirst({
      where: { id: input.userScaleId, userId },
      select: { id: true },
    });

    if (!userScale) throw ApiError.notFound("Tracked scale not found.");

    const entry = await tx.scalePracticeEntry.create({
      data: {
        sessionId,
        userScaleId: userScale.id,
        cleanBpm: input.cleanBpm,
        maxBpm: input.maxBpm,
        durationMinutes: input.durationMinutes,
        notes: input.notes,
      },
    });

    return {
      entry,
      sessionDurationMinutes: await syncSessionDuration(tx, sessionId),
    };
  });
}

export function updateScaleEntry(
  userId: string,
  sessionId: string,
  entryId: string,
  input: UpdateEntryInput,
) {
  return prisma.$transaction(async (tx) => {
    await lockOwnedSession(tx, userId, sessionId);

    const where = entryWhere(userId, sessionId, entryId);
    const existing = await tx.scalePracticeEntry.findFirst({ where });

    if (!existing) throw ApiError.notFound("Scale entry not found.");

    assertTempoOrder(
      input.cleanBpm ?? existing.cleanBpm,
      input.maxBpm ?? existing.maxBpm,
    );

    const entry = await tx.scalePracticeEntry.update({
      where,
      data: {
        cleanBpm: input.cleanBpm,
        maxBpm: input.maxBpm,
        durationMinutes: input.durationMinutes,
        notes: input.notes,
      },
    });

    return {
      entry,
      sessionDurationMinutes: await syncSessionDuration(tx, sessionId),
    };
  });
}

export function deleteScaleEntry(
  userId: string,
  sessionId: string,
  entryId: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockOwnedSession(tx, userId, sessionId);

    const { count } = await tx.scalePracticeEntry.deleteMany({
      where: entryWhere(userId, sessionId, entryId),
    });

    if (count === 0) throw ApiError.notFound("Scale entry not found.");

    await syncSessionDuration(tx, sessionId);
  });
}

export function addExerciseEntry(
  userId: string,
  sessionId: string,
  input: CreateExerciseEntryInput,
) {
  return prisma.$transaction(async (tx) => {
    await lockOwnedSession(tx, userId, sessionId);

    // The tracked exercise must be the user's and its exercise must be visible to them.
    const userExercise = await tx.userExercise.findFirst({
      where: {
        id: input.userExerciseId,
        userId,
        exercise: visibleExercisesWhere(userId),
      },
      select: { id: true },
    });

    if (!userExercise) throw ApiError.notFound("Tracked exercise not found.");

    const entry = await tx.exercisePracticeEntry.create({
      data: {
        sessionId,
        userExerciseId: userExercise.id,
        cleanBpm: input.cleanBpm,
        maxBpm: input.maxBpm,
        durationMinutes: input.durationMinutes,
        notes: input.notes,
      },
    });

    return {
      entry,
      sessionDurationMinutes: await syncSessionDuration(tx, sessionId),
    };
  });
}

export function updateExerciseEntry(
  userId: string,
  sessionId: string,
  entryId: string,
  input: UpdateEntryInput,
) {
  return prisma.$transaction(async (tx) => {
    await lockOwnedSession(tx, userId, sessionId);

    const where = entryWhere(userId, sessionId, entryId);
    const existing = await tx.exercisePracticeEntry.findFirst({ where });

    if (!existing) throw ApiError.notFound("Exercise entry not found.");

    assertTempoOrder(
      input.cleanBpm ?? existing.cleanBpm,
      input.maxBpm ?? existing.maxBpm,
    );

    const entry = await tx.exercisePracticeEntry.update({
      where,
      data: {
        cleanBpm: input.cleanBpm,
        maxBpm: input.maxBpm,
        durationMinutes: input.durationMinutes,
        notes: input.notes,
      },
    });

    return {
      entry,
      sessionDurationMinutes: await syncSessionDuration(tx, sessionId),
    };
  });
}

export function deleteExerciseEntry(
  userId: string,
  sessionId: string,
  entryId: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockOwnedSession(tx, userId, sessionId);

    const { count } = await tx.exercisePracticeEntry.deleteMany({
      where: entryWhere(userId, sessionId, entryId),
    });

    if (count === 0) throw ApiError.notFound("Exercise entry not found.");

    await syncSessionDuration(tx, sessionId);
  });
}
