import { fromDbDate, toDbDate } from "@/server/sessions/dates";

// Pure dashboard rules (E3-06). No database or React imports. See docs/dashboard.md.

const MS_PER_DAY = 86_400_000;
export const DAYS_PER_WEEK = 7;

/** The Monday (YYYY-MM-DD) of the week that contains `date`. Weeks run Monday to Sunday. */
export function startOfWeek(date: string): string {
  const day = toDbDate(date);
  const sinceMonday = (day.getUTCDay() + 6) % 7;

  return fromDbDate(new Date(day.getTime() - sinceMonday * MS_PER_DAY));
}

/** The first day (YYYY-MM-DD) of the month that contains `date`. */
export function startOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export type GoalProgress = {
  /** Daily goal times seven. */
  goalMinutes: number;
  minutes: number;
  /** Whole percent, capped at 100. Rounded down, so 100 means the goal is reached. */
  percent: number;
  reached: boolean;
};

export function weeklyGoal(
  minutes: number,
  dailyGoalMinutes: number,
): GoalProgress {
  const goalMinutes = dailyGoalMinutes * DAYS_PER_WEEK;

  return {
    goalMinutes,
    minutes,
    percent: Math.min(100, Math.floor((minutes / goalMinutes) * 100)),
    reached: minutes >= goalMinutes,
  };
}
