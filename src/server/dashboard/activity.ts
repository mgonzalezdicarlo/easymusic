import { ApiError } from "@/server/api/errors";
import { prisma } from "@/server/db";
import { fromDbDate, todayInTimezone, toDbDate } from "@/server/sessions/dates";

export type ActivityData = {
  /** The user's current date (YYYY-MM-DD), from their stored timezone. */
  today: string;
  dailyGoalMinutes: number;
  /** Minutes practiced per day, keyed by YYYY-MM-DD. Only days with practice are present. */
  days: Record<string, number>;
};

/**
 * Daily practice minutes for the heat map. Like the streak service, it ignores sessions with
 * 0 minutes and dates later than today in the user's timezone. Several sessions on one day
 * are added up.
 */
export async function getActivityDays(
  userId: string,
  now: Date = new Date(),
): Promise<ActivityData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, dailyGoalMinutes: true },
  });

  if (!user) throw ApiError.unauthorized();

  const today = todayInTimezone(user.timezone, now);
  const rows = await prisma.practiceSession.groupBy({
    by: ["date"],
    where: {
      userId,
      durationMinutes: { gt: 0 },
      date: { lte: toDbDate(today) },
    },
    _sum: { durationMinutes: true },
  });
  const days: Record<string, number> = {};

  for (const row of rows) {
    days[fromDbDate(row.date)] = row._sum.durationMinutes ?? 0;
  }

  return { today, dailyGoalMinutes: user.dailyGoalMinutes, days };
}
