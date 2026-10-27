import { isRealDate } from "@/lib/practice-session";

// Pure rules for the activity heat map (E3-05). No React or database imports.
//
// Dates are local calendar dates written as YYYY-MM-DD (ADR-0006). Day arithmetic uses UTC
// midnights, so daylight saving changes cannot shift a day. The caller passes "today" already
// computed in the user's timezone, so this module never reads the clock.

const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
// A month label needs about this many week columns. A closer label replaces the first one.
const MIN_LABEL_GAP_WEEKS = 3;

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

/** Index 0 is Sunday, as in `Date.getUTCDay()`. */
export const WEEKDAY_NAMES = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

/** 0 is no practice. 1 to 4 get darker as the day approaches and exceeds the daily goal. */
export const INTENSITY_LEVELS = [0, 1, 2, 3, 4] as const;
export type IntensityLevel = (typeof INTENSITY_LEVELS)[number];

/** Minutes practiced on a date. A date may appear several times: the minutes are added up. */
export type HeatmapDay = { date: string; minutes: number };

export type HeatmapPeriod = { kind: "recent" } | { kind: "year"; year: number };

export type HeatmapCell = {
  date: string;
  minutes: number;
  level: IntensityLevel;
  /** Later than today. Future days are shown empty and never count. */
  future: boolean;
  /** Column (week) and row (weekday) in the grid. */
  week: number;
  row: number;
};

export type HeatmapMonthLabel = { label: string; weekIndex: number };

export type HeatmapModel = {
  startDate: string;
  endDate: string;
  weekCount: number;
  /** 7 rows (one per weekday) of `weekCount` cells. `null` pads the first and last week. */
  rows: ReadonlyArray<ReadonlyArray<HeatmapCell | null>>;
  monthLabels: HeatmapMonthLabel[];
  cellByDate: ReadonlyMap<string, HeatmapCell>;
  /** Minutes and distinct practiced days in the period, future days excluded. */
  totalMinutes: number;
  activeDays: number;
  /** The cell that gets the tab stop first: the latest day that is not in the future. */
  defaultFocusDate: string | null;
};

export type BuildHeatmapOptions = {
  days: readonly HeatmapDay[];
  dailyGoalMinutes: number;
  today: string;
  /** "recent" (default) is the last 12 months ending today. "year" is a whole calendar year. */
  period?: HeatmapPeriod;
  /** 0 is Sunday, 1 is Monday (default). */
  weekStartsOn?: 0 | 1;
};

function toDayNumber(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`) / MS_PER_DAY;
}

function toDate(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

function weekdayOf(day: number): number {
  return new Date(day * MS_PER_DAY).getUTCDay();
}

function rowOf(day: number, weekStartsOn: number): number {
  return (weekdayOf(day) - weekStartsOn + DAYS_PER_WEEK) % DAYS_PER_WEEK;
}

/** The weekday (0 is Sunday) shown in a grid row. */
export function weekdayOfRow(row: number, weekStartsOn: number): number {
  return (row + weekStartsOn) % DAYS_PER_WEEK;
}

function assertDate(value: string, name: string) {
  if (!isRealDate(value)) {
    throw new RangeError(
      `Unsupported ${name} "${value}". Use a real date as YYYY-MM-DD.`,
    );
  }
}

/**
 * Intensity of a day relative to the daily goal:
 * 0 no practice, 1 under 50% of the goal, 2 from 50% to under 100%,
 * 3 goal met (up to under 200%), 4 twice the goal or more.
 */
export function intensityLevel(
  minutes: number,
  goalMinutes: number,
): IntensityLevel {
  if (!(minutes > 0)) return 0;

  const goal = goalMinutes > 0 ? goalMinutes : 1;

  if (minutes >= goal * 2) return 4;
  if (minutes >= goal) return 3;
  if (minutes * 2 >= goal) return 2;

  return 1;
}

function sumMinutesByDate(days: readonly HeatmapDay[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const { date, minutes } of days) {
    assertDate(date, "practice date");

    if (!Number.isFinite(minutes) || minutes <= 0) continue;

    totals.set(date, (totals.get(date) ?? 0) + minutes);
  }

  return totals;
}

function periodRange(today: string, period: HeatmapPeriod) {
  if (period.kind === "year") {
    const year = String(period.year).padStart(4, "0");
    const start = `${year}-01-01`;

    assertDate(start, "year");

    return { start, end: `${year}-12-31` };
  }

  const [year, month, day] = today.split("-").map(Number);
  // The same date one year ago, plus one day: a window of 12 months ending today.
  const startDay = Date.UTC(year - 1, month - 1, day + 1) / MS_PER_DAY;

  return { start: toDate(startDay), end: today };
}

/** A label above the week that contains the 1st of a month, plus the first week's month. */
function buildMonthLabels(
  rows: HeatmapModel["rows"],
  weekCount: number,
): HeatmapMonthLabel[] {
  const labels: HeatmapMonthLabel[] = [];

  for (let week = 0; week < weekCount; week++) {
    const column = rows.map((row) => row[week]);
    const firstOfMonth = column.find((cell) => cell?.date.endsWith("-01"));
    const anchor =
      firstOfMonth ??
      (week === 0 ? column.find((cell) => cell !== null) : undefined);

    if (anchor) {
      labels.push({
        label: MONTH_NAMES[Number(anchor.date.slice(5, 7)) - 1],
        weekIndex: week,
      });
    }
  }

  // A partial first month would overlap the next label.
  if (
    labels.length > 1 &&
    labels[1].weekIndex - labels[0].weekIndex < MIN_LABEL_GAP_WEEKS
  ) {
    labels.shift();
  }

  return labels;
}

/**
 * Builds the grid for the activity heat map.
 *
 * @throws RangeError for a date that is not a real YYYY-MM-DD date.
 */
export function buildHeatmap({
  days,
  dailyGoalMinutes,
  today,
  period = { kind: "recent" },
  weekStartsOn = 1,
}: BuildHeatmapOptions): HeatmapModel {
  assertDate(today, "today");

  const { start, end } = periodRange(today, period);
  const totals = sumMinutesByDate(days);
  const startDay = toDayNumber(start);
  const endDay = toDayNumber(end);
  const todayDay = toDayNumber(today);
  const gridStart = startDay - rowOf(startDay, weekStartsOn);
  const gridEnd = endDay + (DAYS_PER_WEEK - 1 - rowOf(endDay, weekStartsOn));
  const weekCount = (gridEnd - gridStart + 1) / DAYS_PER_WEEK;

  const rows: (HeatmapCell | null)[][] = Array.from(
    { length: DAYS_PER_WEEK },
    () => [],
  );
  const cellByDate = new Map<string, HeatmapCell>();
  let totalMinutes = 0;
  let activeDays = 0;

  for (let week = 0; week < weekCount; week++) {
    for (let row = 0; row < DAYS_PER_WEEK; row++) {
      const day = gridStart + week * DAYS_PER_WEEK + row;

      if (day < startDay || day > endDay) {
        rows[row].push(null);
        continue;
      }

      const date = toDate(day);
      const future = day > todayDay;
      const minutes = future ? 0 : (totals.get(date) ?? 0);
      const cell: HeatmapCell = {
        date,
        minutes,
        level: intensityLevel(minutes, dailyGoalMinutes),
        future,
        week,
        row,
      };

      rows[row].push(cell);
      cellByDate.set(date, cell);

      if (!future) {
        totalMinutes += minutes;
        if (minutes > 0) activeDays += 1;
      }
    }
  }

  const lastDay = Math.min(endDay, todayDay);

  return {
    startDate: start,
    endDate: end,
    weekCount,
    rows,
    monthLabels: buildMonthLabels(rows, weekCount),
    cellByDate,
    totalMinutes,
    activeDays,
    defaultFocusDate: lastDay >= startDay ? toDate(lastDay) : null,
  };
}

/**
 * Years offered by the year selector, newest first: from the earliest year in `days` (or the
 * current year) up to the current year.
 */
export function heatmapYears(
  days: readonly HeatmapDay[],
  today: string,
): number[] {
  assertDate(today, "today");

  const currentYear = Number(today.slice(0, 4));
  let first = currentYear;

  for (const { date } of days) {
    assertDate(date, "practice date");
    first = Math.min(first, Number(date.slice(0, 4)));
  }

  return Array.from(
    { length: currentYear - first + 1 },
    (_, i) => currentYear - i,
  );
}

const NAVIGATION_DELTAS: Readonly<Record<string, number>> = {
  ArrowUp: -1,
  ArrowDown: 1,
  ArrowLeft: -DAYS_PER_WEEK,
  ArrowRight: DAYS_PER_WEEK,
};
const NAVIGATION_KEYS = new Set([
  ...Object.keys(NAVIGATION_DELTAS),
  "Home",
  "End",
]);

export function isHeatmapNavigationKey(key: string): boolean {
  return NAVIGATION_KEYS.has(key);
}

/**
 * The date to focus after `key` is pressed on `fromDate`, or null to stay put.
 * Up and down move one day, left and right one week, Home and End jump to the first and last
 * day of the same weekday row. Days outside the period and future days cannot be reached.
 */
export function moveFocus(
  model: HeatmapModel,
  fromDate: string,
  key: string,
): string | null {
  const from = model.cellByDate.get(fromDate);

  if (!from) return null;

  if (key === "Home" || key === "End") {
    const row = model.rows[from.row];
    const ordered = key === "Home" ? row : [...row].reverse();
    const target = ordered.find(
      (cell): cell is HeatmapCell => cell !== null && !cell.future,
    );

    return target ? target.date : null;
  }

  const delta = NAVIGATION_DELTAS[key];

  if (delta === undefined) return null;

  const target = model.cellByDate.get(toDate(toDayNumber(fromDate) + delta));

  return target && !target.future ? target.date : null;
}
