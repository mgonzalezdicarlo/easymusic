import { ApiError } from "@/server/api/errors";
import {
  type GoalProgress,
  startOfMonth,
  startOfWeek,
  weeklyGoal,
} from "@/server/dashboard/dashboard";
import { prisma } from "@/server/db";
import { todayInTimezone, toDbDate } from "@/server/sessions/dates";
import { getStreakSummary } from "@/server/streaks/service";
import type { StreakSummary } from "@/server/streaks/streaks";

export type DashboardSummary = {
  streaks: StreakSummary;
  minutesThisWeek: number;
  sessionsThisMonth: number;
  weeklyGoal: GoalProgress;
};

/**
 * Everything the dashboard cards need. Streaks come from the streak service, so the numbers
 * always match. Like the streak service, it ignores sessions with 0 minutes and dates later
 * than today in the user's timezone.
 */
export async function getDashboardSummary(
  userId: string,
  now: Date = new Date(),
): Promise<DashboardSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, dailyGoalMinutes: true },
  });

  if (!user) throw ApiError.unauthorized();

  const today = todayInTimezone(user.timezone, now);
  const practiced = { userId, durationMinutes: { gt: 0 } };
  const since = (from: string) => ({
    gte: toDbDate(from),
    lte: toDbDate(today),
  });

  const [streaks, week, sessionsThisMonth] = await Promise.all([
    getStreakSummary(userId, now),
    prisma.practiceSession.aggregate({
      where: { ...practiced, date: since(startOfWeek(today)) },
      _sum: { durationMinutes: true },
    }),
    prisma.practiceSession.count({
      where: { ...practiced, date: since(startOfMonth(today)) },
    }),
  ]);
  const minutesThisWeek = week._sum.durationMinutes ?? 0;

  return {
    streaks,
    minutesThisWeek,
    sessionsThisMonth,
    weeklyGoal: weeklyGoal(minutesThisWeek, user.dailyGoalMinutes),
  };
}
