"use client";

import {
  type CSSProperties,
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
  type HeatmapCell,
  type HeatmapDay,
  heatmapYears,
  INTENSITY_LEVELS,
  type IntensityLevel,
  isHeatmapNavigationKey,
  moveFocus,
  WEEKDAY_NAMES,
  weekdayOfRow,
} from "@/features/heatmap/heatmap";
import { formatMinutes, formatSessionDate } from "@/lib/practice-session";
import { cn } from "@/lib/utils";

// Colors come from the theme tokens, so the grid follows the light and dark themes.
const LEVEL_CLASS: Record<IntensityLevel, string> = {
  0: "bg-muted ring-1 ring-inset ring-foreground/10",
  1: "bg-primary/30",
  2: "bg-primary/55",
  3: "bg-primary/80",
  4: "bg-primary",
};

const GRID_VARS = { "--cell": "0.75rem", "--gap": "3px" } as CSSProperties;
// Monday, Wednesday and Friday get a visible label.
const LABELLED_WEEKDAYS = new Set([1, 3, 5]);
// Tooltips of cells this close to an edge align to it, so the scroll area never clips them.
const TOOLTIP_EDGE_WEEKS = 7;

type ActivityHeatmapProps = {
  /** Minutes per day. A date may appear several times (one entry per session): they add up. */
  days: readonly HeatmapDay[];
  dailyGoalMinutes: number;
  /** The user's current date (YYYY-MM-DD) in their timezone, so server and browser agree. */
  today: string;
  /** 0 is Sunday, 1 is Monday (default). */
  weekStartsOn?: 0 | 1;
  className?: string;
};

function describeMinutes(minutes: number) {
  return minutes > 0 ? formatMinutes(minutes) : "no practice";
}

function tooltipAlignment(week: number, weekCount: number) {
  if (week < TOOLTIP_EDGE_WEEKS) return "left-0";
  if (week >= weekCount - TOOLTIP_EDGE_WEEKS) return "right-0";

  return "left-1/2 -translate-x-1/2";
}

export function ActivityHeatmap({
  days,
  dailyGoalMinutes,
  today,
  weekStartsOn = 1,
  className,
}: ActivityHeatmapProps) {
  const id = useId();
  const selectId = `${id}-period`;
  const hintId = `${id}-hint`;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState("recent");
  const [focused, setFocused] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const years = useMemo(() => heatmapYears(days, today), [days, today]);
  const selected =
    view !== "recent" && years.includes(Number(view)) ? view : "recent";
  const model = useMemo(
    () =>
      buildHeatmap({
        days,
        dailyGoalMinutes,
        today,
        weekStartsOn,
        period:
          selected === "recent"
            ? { kind: "recent" }
            : { kind: "year", year: Number(selected) },
      }),
    [days, dailyGoalMinutes, today, weekStartsOn, selected],
  );

  // Roving tabindex: one cell is in the tab order, the others are reached with the arrow keys.
  const focusedCell = focused ? model.cellByDate.get(focused) : undefined;
  const tabStop =
    focusedCell && !focusedCell.future
      ? focusedCell.date
      : model.defaultFocusDate;

  // Show the newest weeks first on narrow screens.
  useEffect(() => {
    const scroller = scrollerRef.current;

    if (scroller) {
      scroller.scrollLeft = selected === "recent" ? scroller.scrollWidth : 0;
    }
  }, [selected]);

  // A tap outside the grid closes the tooltip (touch devices have no pointer leave).
  useEffect(() => {
    if (active === null) return;

    function onPointerDown(event: PointerEvent) {
      if (!gridRef.current?.contains(event.target as Node)) setActive(null);
    }

    document.addEventListener("pointerdown", onPointerDown);

    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [active]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setActive(null);
      return;
    }

    if (!isHeatmapNavigationKey(event.key)) return;

    event.preventDefault();

    const from = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-date]",
    )?.dataset.date;
    const next = from ? moveFocus(model, from, event.key) : null;

    if (next) {
      gridRef.current
        ?.querySelector<HTMLElement>(`[data-date="${next}"]`)
        ?.focus();
    }
  }

  const periodLabel = selected === "recent" ? "the last 12 months" : selected;
  const summary =
    model.activeDays === 0
      ? `No practice logged in ${periodLabel}.`
      : `${model.activeDays === 1 ? "1 day" : `${model.activeDays} days`} practiced · ${formatMinutes(model.totalMinutes)} in ${periodLabel}`;
  const columnsWidth = `calc(${model.weekCount} * (var(--cell) + var(--gap)))`;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>{summary}</CardDescription>
        <CardAction>
          <label htmlFor={selectId} className="sr-only">
            Period
          </label>
          <select
            id={selectId}
            value={selected}
            onChange={(event) => {
              setView(event.target.value);
              setActive(null);
            }}
            className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 [&>option]:bg-popover [&>option]:text-popover-foreground h-8 rounded-lg border bg-transparent px-2 py-1 text-sm transition-colors outline-none focus-visible:ring-3"
          >
            <option value="recent">Last 12 months</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* The top padding leaves room for the tooltip above the first row. */}
        <div ref={scrollerRef} className="overflow-x-auto pt-5 pb-2">
          <div style={GRID_VARS} className="w-max">
            <div aria-hidden="true" className="flex gap-(--gap)">
              <div className="w-8 shrink-0" />
              <div className="relative h-4" style={{ width: columnsWidth }}>
                {model.monthLabels.map(({ label, weekIndex }) => (
                  <span
                    key={weekIndex}
                    className="text-muted-foreground absolute top-0 text-[10px] leading-4"
                    style={{
                      left: `calc(${weekIndex} * (var(--cell) + var(--gap)))`,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div
              ref={gridRef}
              role="grid"
              aria-label={`Practice activity, ${periodLabel}`}
              aria-describedby={hintId}
              onKeyDown={onKeyDown}
              className="mt-1 flex flex-col gap-(--gap)"
            >
              {model.rows.map((cells, row) => {
                const weekday = weekdayOfRow(row, weekStartsOn);

                return (
                  <div
                    key={row}
                    role="row"
                    className="flex items-center gap-(--gap)"
                  >
                    <div
                      role="rowheader"
                      className="text-muted-foreground flex h-(--cell) w-8 shrink-0 items-center pr-1 text-[10px] leading-none"
                    >
                      <span
                        className={
                          LABELLED_WEEKDAYS.has(weekday) ? undefined : "sr-only"
                        }
                      >
                        {WEEKDAY_NAMES[weekday]}
                      </span>
                    </div>
                    {cells.map((cell, week) => {
                      if (cell === null) {
                        return (
                          <span
                            key={week}
                            aria-hidden="true"
                            className="size-(--cell) shrink-0"
                          />
                        );
                      }

                      if (cell.future) {
                        return (
                          <span
                            key={cell.date}
                            aria-hidden="true"
                            className="ring-border/60 size-(--cell) shrink-0 rounded-[3px] ring-1 ring-inset"
                          />
                        );
                      }

                      return (
                        <HeatmapCellView
                          key={cell.date}
                          cell={cell}
                          weekCount={model.weekCount}
                          tabStop={cell.date === tabStop}
                          showTooltip={cell.date === active}
                          onShow={() => setActive(cell.date)}
                          onHide={() =>
                            setActive((current) =>
                              current === cell.date ? null : current,
                            )
                          }
                          onFocus={() => {
                            setFocused(cell.date);
                            setActive(cell.date);
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p id={hintId} className="sr-only">
          Each square is a day. Darker squares mean more minutes practiced
          compared with your daily goal of {dailyGoalMinutes} minutes. Use the
          arrow keys to move between days.
        </p>

        <div
          aria-hidden="true"
          className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs"
        >
          <span>
            Shading is relative to your {dailyGoalMinutes} min daily goal.
          </span>
          <span className="flex items-center gap-1.5">
            <span>Less</span>
            {INTENSITY_LEVELS.map((level) => (
              <span
                key={level}
                className={cn("size-3 rounded-[3px]", LEVEL_CLASS[level])}
              />
            ))}
            <span>More</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

type HeatmapCellViewProps = {
  cell: HeatmapCell;
  weekCount: number;
  tabStop: boolean;
  showTooltip: boolean;
  onShow: () => void;
  onHide: () => void;
  onFocus: () => void;
};

function HeatmapCellView({
  cell,
  weekCount,
  tabStop,
  showTooltip,
  onShow,
  onHide,
  onFocus,
}: HeatmapCellViewProps) {
  const date = formatSessionDate(cell.date);
  const minutes = describeMinutes(cell.minutes);

  return (
    <div
      role="gridcell"
      data-date={cell.date}
      data-level={cell.level}
      tabIndex={tabStop ? 0 : -1}
      aria-label={`${date}: ${minutes}`}
      onMouseEnter={onShow}
      onMouseLeave={onHide}
      onClick={onShow}
      onFocus={onFocus}
      onBlur={onHide}
      className={cn(
        "focus-visible:outline-ring relative size-(--cell) shrink-0 cursor-default rounded-[3px] outline-hidden focus-visible:outline-2 focus-visible:outline-offset-1",
        LEVEL_CLASS[cell.level],
      )}
    >
      {showTooltip ? (
        <span
          aria-hidden="true"
          className={cn(
            "bg-popover text-popover-foreground ring-foreground/10 pointer-events-none absolute bottom-full z-20 mb-1.5 w-max rounded-md px-2 py-1 text-xs shadow-md ring-1",
            tooltipAlignment(cell.week, weekCount),
          )}
        >
          {date} · {minutes}
        </span>
      ) : null}
    </div>
  );
}
