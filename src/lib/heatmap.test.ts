// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  addDays,
  buildHeatmap,
  type HeatmapCell,
  heatmapYears,
  intensityLevel,
  neighborDate,
  rollingPeriod,
  startOfWeek,
  yearPeriod,
} from "@/lib/heatmap";

const today = "2026-10-28"; // Wednesday

function realCells(weeks: ReturnType<typeof buildHeatmap>["weeks"]) {
  return weeks.flat().filter((cell): cell is HeatmapCell => cell !== null);
}

describe("addDays and startOfWeek", () => {
  it("adds days across months, years and leap days", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-02-28", 2)).toBe("2024-03-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("finds the Monday of a week, Sunday included", () => {
    expect(startOfWeek("2026-10-28")).toBe("2026-10-26");
    expect(startOfWeek("2026-10-26")).toBe("2026-10-26");
    expect(startOfWeek("2026-11-01")).toBe("2026-10-26");
  });
});

describe("intensityLevel", () => {
  it.each([
    [0, 0],
    [1, 1],
    [7, 1],
    [8, 2],
    [14, 2],
    [15, 3],
    [29, 3],
    [30, 4],
    [90, 4],
  ])("maps %i minutes of a 30 minute goal to level %i", (minutes, level) => {
    expect(intensityLevel(minutes, 30)).toBe(level);
  });
});

describe("periods", () => {
  it("covers the last 52 weeks, ending today", () => {
    expect(rollingPeriod(today)).toEqual({
      start: "2025-11-03",
      end: "2026-10-28",
    });
  });

  it("ends a past year on December 31 and the current year today", () => {
    expect(yearPeriod(2025, today)).toEqual({
      start: "2025-01-01",
      end: "2025-12-31",
    });
    expect(yearPeriod(2026, today)).toEqual({
      start: "2026-01-01",
      end: "2026-10-28",
    });
  });
});

describe("heatmapYears", () => {
  it("lists the years from the first practice to this year, newest first", () => {
    expect(
      heatmapYears(["2024-05-01", "2026-01-02", "2025-03-03"], today),
    ).toEqual([2026, 2025, 2024]);
  });

  it("offers only the current year without data", () => {
    expect(heatmapYears([], today)).toEqual([2026]);
  });
});

describe("buildHeatmap", () => {
  const rolling = rollingPeriod(today);

  it("renders an empty grid without practice", () => {
    const heatmap = buildHeatmap({
      period: rolling,
      minutesByDate: {},
      dailyGoalMinutes: 30,
    });
    const cells = realCells(heatmap.weeks);

    expect(heatmap.weeks).toHaveLength(52);
    expect(heatmap.weeks.every((week) => week.length === 7)).toBe(true);
    expect(cells).toHaveLength(360);
    expect(cells.every((cell) => cell.level === 0)).toBe(true);
    expect(heatmap).toMatchObject({ totalMinutes: 0, activeDays: 0 });
  });

  it("maps sparse data to levels and ignores days outside the period", () => {
    const heatmap = buildHeatmap({
      period: rolling,
      minutesByDate: {
        "2026-10-28": 30,
        "2026-10-27": 10,
        "2026-01-15": 60,
        "2025-06-01": 20,
      },
      dailyGoalMinutes: 30,
    });
    const byDate = new Map(realCells(heatmap.weeks).map((c) => [c.date, c]));

    expect(byDate.get("2026-10-28")).toMatchObject({ minutes: 30, level: 4 });
    expect(byDate.get("2026-10-27")).toMatchObject({ minutes: 10, level: 2 });
    expect(byDate.get("2026-01-15")).toMatchObject({ level: 4 });
    expect(byDate.has("2025-06-01")).toBe(false);
    expect(heatmap).toMatchObject({ totalMinutes: 100, activeDays: 3 });
  });

  it("leaves the days after today empty in the current week", () => {
    const heatmap = buildHeatmap({
      period: rolling,
      minutesByDate: {},
      dailyGoalMinutes: 30,
    });

    expect(heatmap.weeks[51].map((cell) => cell?.date ?? null)).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      null,
      null,
      null,
      null,
    ]);
    expect(heatmap.lastDate).toBe("2026-10-28");
  });

  it("renders a full year with padding before January 1", () => {
    const everyDay = Object.fromEntries(
      Array.from({ length: 365 }, (_, index) => [
        addDays("2025-01-01", index),
        30,
      ]),
    );
    const heatmap = buildHeatmap({
      period: yearPeriod(2025, today),
      minutesByDate: everyDay,
      dailyGoalMinutes: 30,
    });
    const cells = realCells(heatmap.weeks);

    expect(heatmap.weeks).toHaveLength(53);
    expect(heatmap.weeks[0].slice(0, 3)).toEqual([
      null,
      null,
      expect.objectContaining({ date: "2025-01-01" }),
    ]);
    expect(cells).toHaveLength(365);
    expect(cells.every((cell) => cell.level === 4)).toBe(true);
    expect(heatmap).toMatchObject({ totalMinutes: 10_950, activeDays: 365 });
  });

  it("labels each month once, in order", () => {
    const heatmap = buildHeatmap({
      period: yearPeriod(2025, today),
      minutesByDate: {},
      dailyGoalMinutes: 30,
    });

    expect(heatmap.monthLabels.filter(Boolean)).toEqual([
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
    ]);
  });
});

describe("neighborDate", () => {
  const gridStart = "2025-11-03";

  it("moves between weeks with left and right, and between weekdays with up and down", () => {
    expect(neighborDate(gridStart, "2026-10-28", "ArrowLeft", 52)).toBe(
      "2026-10-21",
    );
    expect(neighborDate(gridStart, "2026-10-28", "ArrowUp", 52)).toBe(
      "2026-10-27",
    );
    expect(neighborDate(gridStart, "2026-10-28", "ArrowDown", 52)).toBe(
      "2026-10-29",
    );
  });

  it("stops at the edges of the grid", () => {
    expect(neighborDate(gridStart, "2026-10-28", "ArrowRight", 52)).toBeNull();
    expect(neighborDate(gridStart, gridStart, "ArrowLeft", 52)).toBeNull();
    expect(neighborDate(gridStart, gridStart, "ArrowUp", 52)).toBeNull();
    expect(neighborDate(gridStart, "2025-11-09", "ArrowDown", 52)).toBeNull();
  });
});
