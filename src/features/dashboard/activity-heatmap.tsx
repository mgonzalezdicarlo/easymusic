"use client";

import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildHeatmap,
  type HeatmapLevel,
  heatmapYears,
  isArrowKey,
  neighborDate,
  rollingPeriod,
  yearPeriod,
} from "@/lib/heatmap";
import { formatMinutes, formatSessionDate } from "@/lib/practice-session";
import { cn } from "@/lib/utils";

const RECENT = "recent";
const HINT = "Hover, tap or focus a day to see how long you practiced.";
// Monday first. Only some rows are labelled, as on GitHub.
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""] as const;

// Built from the theme tokens, so it follows the light and dark themes.
const LEVEL_CLASSES: Record<HeatmapLevel, string> = {
  0: "bg-muted ring-1 ring-inset ring-foreground/5",
  1: "bg-primary/25",
  2: "bg-primary/50",
  3: "bg-primary/75",
  4: "bg-primary",
};
const LEGEND_LEVELS: readonly HeatmapLevel[] = [0, 1, 2, 3, 4];

type ActivityHeatmapProps = {
  /** Minutes practiced per day (YYYY-MM-DD). Days without practice may be missing. */
  days: Readonly<Record<string, number>>;
  /** The user's current date (YYYY-MM-DD). */
  today: string;
  dailyGoalMinutes: number;
};

function cellLabel(date: string, minutes: number): string {
  return `${formatSessionDate(date)}: ${
    minutes === 0 ? "no practice" : formatMinutes(minutes)
  }`;
}

export function ActivityHeatmap({
  days,
  today,
  dailyGoalMinutes,
}: Readonly<ActivityHeatmapProps>) {
  const selectId = useId();
  const [period, setPeriod] = useState(RECENT);
  const [active, setActive] = useState<string | null>(null);
  const [focusDate, setFocusDate] = useState<string | null>(null);
  const cells = useRef(new Map<string, HTMLDivElement>());
  const scroller = useRef<HTMLDivElement>(null);

  const years = useMemo(
    () => heatmapYears(Object.keys(days), today),
    [days, today],
  );
  const heatmap = useMemo(
    () =>
      buildHeatmap({
        period:
          period === RECENT
            ? rollingPeriod(today)
            : yearPeriod(Number(period), today),
        minutesByDate: days,
        dailyGoalMinutes,
      }),
    [period, today, days, dailyGoalMinutes],
  );

  // On small screens the grid scrolls sideways. Show the latest weeks first.
  useEffect(() => {
    const element = scroller.current;

    if (element) {
      element.scrollLeft = period === RECENT ? element.scrollWidth : 0;
    }
  }, [period]);

  // One tab stop for the whole grid: the focused day, or the last day of the period.
  const tabDate = focusDate ?? heatmap.lastDate;
  const activeDays = heatmap.activeDays;
  const summary =
    activeDays === 0
      ? "No practice logged in this period."
      : `${formatMinutes(heatmap.totalMinutes)} practiced on ${activeDays} ${
          activeDays === 1 ? "day" : "days"
        }.`;
  const activeMinutes = active
    ? (heatmap.weeks.flat().find((cell) => cell?.date === active)?.minutes ?? 0)
    : null;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>, date: string) {
    if (!isArrowKey(event.key)) return;

    event.preventDefault();

    const target = neighborDate(
      heatmap.gridStart,
      date,
      event.key,
      heatmap.weeks.length,
    );

    // Days after today have no cell, so the focus stays where it is.
    if (target) cells.current.get(target)?.focus();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>{summary}</CardDescription>
        <CardAction>
          <label htmlFor={selectId} className="sr-only">
            Period
          </label>
          <select
            id={selectId}
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value);
              setActive(null);
              setFocusDate(null);
            }}
            className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border bg-transparent px-2 text-sm outline-none focus-visible:ring-3 [&>option]:bg-popover [&>option]:text-popover-foreground"
          >
            <option value={RECENT}>Last 12 months</option>
            {years.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div ref={scroller} className="overflow-x-auto pb-2">
          <div
            role="grid"
            aria-label="Practice activity by day"
            className="inline-flex min-w-max flex-col gap-[3px]"
          >
            <div aria-hidden="true" className="flex gap-[3px]">
              <span className="w-8 shrink-0" />
              {heatmap.monthLabels.map((name, index) => (
                <div key={index} className="relative h-4 w-3.5 shrink-0">
                  {name ? (
                    <span className="text-muted-foreground absolute left-0 text-xs whitespace-nowrap">
                      {name}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            {WEEKDAY_LABELS.map((weekday, row) => (
              <div key={row} role="row" className="flex items-center gap-[3px]">
                <span
                  aria-hidden="true"
                  className="text-muted-foreground w-8 shrink-0 text-xs"
                >
                  {weekday}
                </span>
                {heatmap.weeks.map((week, weekIndex) => {
                  const cell = week[row];

                  if (!cell) {
                    return (
                      <div
                        key={weekIndex}
                        aria-hidden="true"
                        className="size-3.5 shrink-0"
                      />
                    );
                  }

                  const label = cellLabel(cell.date, cell.minutes);

                  return (
                    <div
                      key={cell.date}
                      ref={(element) => {
                        if (element) cells.current.set(cell.date, element);
                        else cells.current.delete(cell.date);
                      }}
                      role="gridcell"
                      tabIndex={cell.date === tabDate ? 0 : -1}
                      aria-label={label}
                      title={label}
                      data-level={cell.level}
                      onFocus={() => {
                        setFocusDate(cell.date);
                        setActive(cell.date);
                      }}
                      onMouseEnter={() => setActive(cell.date)}
                      onClick={() => {
                        setFocusDate(cell.date);
                        setActive(cell.date);
                      }}
                      onKeyDown={(event) => onKeyDown(event, cell.date)}
                      className={cn(
                        "focus-visible:ring-ring ring-offset-background size-3.5 shrink-0 rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                        LEVEL_CLASSES[cell.level],
                        active === cell.date && "ring-foreground/60 ring-2",
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-muted-foreground">
            {active && activeMinutes !== null
              ? cellLabel(active, activeMinutes)
              : HINT}
          </p>
          <div
            aria-hidden="true"
            className="text-muted-foreground flex items-center gap-1.5"
          >
            <span>Less</span>
            {LEGEND_LEVELS.map((level) => (
              <span
                key={level}
                className={cn("size-3.5 rounded-[3px]", LEVEL_CLASSES[level])}
              />
            ))}
            <span>More</span>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Darker days are closer to your {dailyGoalMinutes}-minute daily goal.
        </p>
      </CardContent>
    </Card>
  );
}
