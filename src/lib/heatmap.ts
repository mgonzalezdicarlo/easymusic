// Pure rules for the activity heat map (E3-05). No React, database or server imports, so the
// grid can be built in the browser and unit tested. Dates are YYYY-MM-DD strings, and all day
// arithmetic uses UTC midnights, so daylight saving changes cannot shift a day. See docs/heatmap.md.

const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
/** The "last 12 months" view shows this many week columns, ending with the current week. */
const RECENT_WEEKS = 52;
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export type HeatmapCell = {
  date: string;
  minutes: number;
  level: HeatmapLevel;
};

/** Seven entries, Monday first. `null` marks a day outside the period (padding or future). */
export type HeatmapWeek = (HeatmapCell | null)[];

export type HeatmapPeriod = { start: string; end: string };

export type Heatmap = {
  /** The Monday of the first column. */
  gridStart: string;
  /** The last day of the period, which is the last real cell. */
  lastDate: string;
  weeks: HeatmapWeek[];
  /** One entry per week column: a month name where a new month starts, otherwise null. */
  monthLabels: (string | null)[];
  totalMinutes: number;
  activeDays: number;
};

function toTime(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}

export function addDays(date: string, days: number): string {
  return new Date(toTime(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

function dayDiff(from: string, to: string): number {
  return Math.round((toTime(to) - toTime(from)) / MS_PER_DAY);
}

/** The Monday of the week that contains `date`. */
export function startOfWeek(date: string): string {
  const sinceMonday = (new Date(toTime(date)).getUTCDay() + 6) % 7;

  return addDays(date, -sinceMonday);
}

/**
 * Intensity of a day relative to the daily goal: 0 for no practice, then 1 below 25 % of the
 * goal, 2 below 50 %, 3 below 100 % and 4 when the goal is reached.
 */
export function intensityLevel(
  minutes: number,
  dailyGoalMinutes: number,
): HeatmapLevel {
  if (minutes <= 0) return 0;

  const ratio = minutes / dailyGoalMinutes;

  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 1) return 3;

  return 4;
}

/** The last 52 weeks, ending today. */
export function rollingPeriod(today: string): HeatmapPeriod {
  return {
    start: addDays(startOfWeek(today), -(RECENT_WEEKS - 1) * DAYS_PER_WEEK),
    end: today,
  };
}

/** A calendar year. The current year ends today. */
export function yearPeriod(year: number, today: string): HeatmapPeriod {
  const end = `${year}-12-31`;

  return { start: `${year}-01-01`, end: end > today ? today : end };
}

/** Years that can be selected, newest first: from the first practiced year to today's year. */
export function heatmapYears(dates: Iterable<string>, today: string): number[] {
  const currentYear = Number(today.slice(0, 4));
  let first = currentYear;

  for (const date of dates) {
    first = Math.min(first, Number(date.slice(0, 4)));
  }

  return Array.from(
    { length: currentYear - first + 1 },
    (_, index) => currentYear - index,
  );
}

function monthOfWeek(week: HeatmapWeek): number | null {
  const cell = week.find((item) => item !== null);

  return cell ? Number(cell.date.slice(5, 7)) : null;
}

function labelMonths(weeks: readonly HeatmapWeek[]): (string | null)[] {
  return weeks.map((week, index) => {
    const month = monthOfWeek(week);

    if (month === null) return null;
    if (index > 0 && monthOfWeek(weeks[index - 1]) === month) return null;
    // A short first column would overlap the label of the next one.
    if (index === 0 && weeks.length > 1 && monthOfWeek(weeks[1]) !== month) {
      return null;
    }

    return MONTH_NAMES[month - 1];
  });
}

export function buildHeatmap({
  period,
  minutesByDate,
  dailyGoalMinutes,
}: {
  period: HeatmapPeriod;
  minutesByDate: Readonly<Record<string, number>>;
  dailyGoalMinutes: number;
}): Heatmap {
  const gridStart = startOfWeek(period.start);
  const weekCount =
    Math.floor(dayDiff(gridStart, startOfWeek(period.end)) / DAYS_PER_WEEK) + 1;
  let totalMinutes = 0;
  let activeDays = 0;

  const weeks = Array.from({ length: weekCount }, (_, weekIndex) =>
    Array.from({ length: DAYS_PER_WEEK }, (_, row): HeatmapCell | null => {
      const date = addDays(gridStart, weekIndex * DAYS_PER_WEEK + row);

      if (date < period.start || date > period.end) return null;

      const minutes = minutesByDate[date] ?? 0;

      totalMinutes += minutes;
      if (minutes > 0) activeDays += 1;

      return {
        date,
        minutes,
        level: intensityLevel(minutes, dailyGoalMinutes),
      };
    }),
  );

  return {
    gridStart,
    lastDate: period.end,
    weeks,
    monthLabels: labelMonths(weeks),
    totalMinutes,
    activeDays,
  };
}

export type ArrowKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown";

export function isArrowKey(key: string): key is ArrowKey {
  return (
    key === "ArrowLeft" ||
    key === "ArrowRight" ||
    key === "ArrowUp" ||
    key === "ArrowDown"
  );
}

/**
 * The date one step from `date` in the grid: left and right change the week, up and down
 * change the weekday. Returns null at the edge of the grid. The result may still be a day
 * outside the period, which has no cell.
 */
export function neighborDate(
  gridStart: string,
  date: string,
  key: ArrowKey,
  weekCount: number,
): string | null {
  const offset = dayDiff(gridStart, date);
  const column = Math.floor(offset / DAYS_PER_WEEK);
  const row = offset % DAYS_PER_WEEK;
  const nextColumn =
    column + (key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : 0);
  const nextRow = row + (key === "ArrowDown" ? 1 : key === "ArrowUp" ? -1 : 0);

  if (
    nextColumn < 0 ||
    nextColumn >= weekCount ||
    nextRow < 0 ||
    nextRow >= DAYS_PER_WEEK
  ) {
    return null;
  }

  return addDays(gridStart, nextColumn * DAYS_PER_WEEK + nextRow);
}
