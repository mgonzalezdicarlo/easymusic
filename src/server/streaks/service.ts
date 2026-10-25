import { ApiError } from "@/server/api/errors";
import { prisma } from "@/server/db";
import { fromDbDate } from "@/server/sessions/dates";
import { calculateStreaks } from "@/server/streaks/streaks";

/**
 * Streaks for one user. The timezone is read from the database on every call, so a change
 * in Settings applies immediately. Sessions with 0 minutes are empty shells and do not count.
 */
export async function getStreakSummary(userId: string, now: Date = new Date()) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });

  if (!user) throw ApiError.unauthorized();

  const sessions = await prisma.practiceSession.findMany({
    where: { userId, durationMinutes: { gt: 0 } },
    select: { date: true },
  });

  return calculateStreaks(
    sessions.map((session) => fromDbDate(session.date)),
    user.timezone,
    now,
  );
}
