import { ApiError } from "@/server/api/errors";
import { prisma } from "@/server/db";
import type { LogScalePracticeInput } from "@/server/scales/practice-schemas";
import { todayInTimezone, toDbDate } from "@/server/sessions/dates";
import { syncSessionDuration } from "@/server/sessions/entries";
import { type Db, lockOwnedSession } from "@/server/sessions/sessions";

const NOT_FOUND = "Tracked scale not found.";

/**
 * Today's session that entries can join: the newest one that already has entries or is an
 * empty 0-minute session. A session with a manual duration and no entries is left alone,
 * because adding entries would replace its minutes with their sum (docs/sessions-api.md).
 */
async function findTodaySession(tx: Db, userId: string, today: string) {
  const sessions = await tx.practiceSession.findMany({
    where: { userId, date: toDbDate(today) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      durationMinutes: true,
      _count: { select: { scaleEntries: true, exerciseEntries: true } },
    },
  });

  return (
    sessions.find(
      (session) =>
        session.durationMinutes === 0 ||
        session._count.scaleEntries + session._count.exerciseEntries > 0,
    ) ?? null
  );
}

/**
 * Logs one or more scales in today's session (the date in the user's timezone), creating the
 * session when there is none. All or nothing: any failure rolls back, the new session included.
 */
export function logScalePractice(
  userId: string,
  input: LogScalePracticeInput,
  now: Date = new Date(),
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    if (!user) throw ApiError.unauthorized();

    const ids = [...new Set(input.entries.map((entry) => entry.userScaleId))];
    const tracked = await tx.userScale.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true, status: true },
    });

    if (tracked.length !== ids.length) throw ApiError.notFound(NOT_FOUND);

    if (tracked.some((setup) => setup.status === "ARCHIVED")) {
      throw ApiError.conflict(
        "Restore an archived scale setup before logging practice for it.",
      );
    }

    const today = todayInTimezone(user.timezone, now);
    const existing = await findTodaySession(tx, userId, today);
    const sessionId =
      existing?.id ??
      (
        await tx.practiceSession.create({
          data: { userId, date: toDbDate(today), durationMinutes: 0 },
          select: { id: true },
        })
      ).id;

    await lockOwnedSession(tx, userId, sessionId);

    const entries = await tx.scalePracticeEntry.createManyAndReturn({
      data: input.entries.map((entry) => ({
        sessionId,
        userScaleId: entry.userScaleId,
        cleanBpm: entry.cleanBpm,
        maxBpm: entry.maxBpm,
        durationMinutes: entry.durationMinutes,
        notes: entry.notes,
      })),
    });

    return {
      sessionId,
      createdSession: existing === null,
      sessionDurationMinutes: await syncSessionDuration(tx, sessionId),
      entries,
    };
  });
}
