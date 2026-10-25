import {
  isSupportedDate,
  todayInTimezone,
  toDbDate,
} from "@/server/sessions/dates";

// Pure streak rules (E3-04). No database or React imports. See docs/streaks.md.
//
// Session dates are local calendar dates (ADR-0006), so a streak is a run of consecutive
// calendar dates. Day arithmetic uses UTC midnights, so daylight saving changes cannot
// shift a day. The timezone only decides which date "today" is.

const MS_PER_DAY = 86_400_000;

export type StreakSummary = {
  /**
   * Consecutive practiced days ending today. If today has no session yet, the run ending
   * yesterday still counts, because the day is not over. Otherwise 0.
   */
  currentStreak: number;
  /** The longest run of consecutive practiced days in the whole history. */
  longestStreak: number;
  /** Sessions counted, several per day included. */
  totalSessions: number;
  /** Distinct days with at least one session. */
  totalActiveDays: number;
  /** Latest practiced date (YYYY-MM-DD), or null with no practice. */
  lastPracticeDate: string | null;
  practicedToday: boolean;
};

function dayNumber(date: string): number {
  return toDbDate(date).getTime() / MS_PER_DAY;
}

/**
 * Calculates streaks and totals.
 *
 * @param dates Session dates as YYYY-MM-DD. Any order, duplicates allowed (one entry per
 * session). Dates later than today in `timezone` are ignored.
 * @param timezone IANA timezone name of the user, used to decide what today is.
 * @param today The current instant. Passed in so the function stays pure and testable.
 * @throws RangeError for a date that is not a real YYYY-MM-DD date or an invalid timezone.
 */
export function calculateStreaks(
  dates: readonly string[],
  timezone: string,
  today: Date,
): StreakSummary {
  const todayDate = todayInTimezone(timezone, today);
  const days = new Set<number>();
  let totalSessions = 0;
  let lastPracticeDate: string | null = null;

  for (const date of dates) {
    if (!isSupportedDate(date)) {
      throw new RangeError(
        `Unsupported practice date "${date}". Use a real date as YYYY-MM-DD.`,
      );
    }

    // ISO dates compare correctly as text.
    if (date > todayDate) continue;

    totalSessions += 1;
    days.add(dayNumber(date));

    if (lastPracticeDate === null || date > lastPracticeDate) {
      lastPracticeDate = date;
    }
  }

  let longestStreak = 0;
  let lastRun = 0;
  let previous: number | null = null;

  for (const day of [...days].sort((a, b) => a - b)) {
    lastRun = previous !== null && day === previous + 1 ? lastRun + 1 : 1;
    longestStreak = Math.max(longestStreak, lastRun);
    previous = day;
  }

  // `previous` is the latest practiced day and `lastRun` is the run that ends on it. That
  // run is the current streak while the latest day is today or yesterday.
  const alive = previous !== null && previous >= dayNumber(todayDate) - 1;

  return {
    currentStreak: alive ? lastRun : 0,
    longestStreak,
    totalSessions,
    totalActiveDays: days.size,
    lastPracticeDate,
    practicedToday: lastPracticeDate === todayDate,
  };
}
