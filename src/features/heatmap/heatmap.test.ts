// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  buildHeatmap,
  type HeatmapDay,
  heatmapYears,
  intensityLevel,
  moveFocus,
} from "@/features/heatmap/heatmap";

const TODAY = "2026-10-24"; // a Saturday

function recent(
  days: HeatmapDay[] = [],
  extra: Partial<Parameters<typeof buildHeatmap>[0]> = {},
) {
  return buildHeatmap({ days, dailyGoalMinutes: 30, today: TODAY, ...extra });
}

const year = (value: number) =>
  recent([], { period: { kind: "year", year: value } });

describe("intensityLevel", () => {
  it.each([
    [0, 0],
    [-5, 0],
    [Number.NaN, 0],
    [1, 1],
    [14, 1],
    [15, 2],
    [29, 2],
    [30, 3],
    [59, 3],
    [60, 4],
    [500, 4],
  ])("maps %s minutes to level %s for a 30 minute goal", (minutes, level) => {
    expect(intensityLevel(minutes, 30)).toBe(level);
  });

  it("treats an invalid goal as 1 minute", () => {
    expect(intensityLevel(5, 0)).toBe(4);
  });
});

describe("buildHeatmap: last 12 months", () => {
  it("covers the 12 months ending today in 53 Monday-first weeks", () => {
    const model = recent();

    expect(model.startDate).toBe("2025-10-25");
    expect(model.endDate).toBe(TODAY);
    expect(model.weekCount).toBe(53);
    expect(model.rows).toHaveLength(7);
    expect(model.cellByDate.size).toBe(365);
    // Saturdays are row 5 when the week starts on Monday. The edges are padding.
    expect(model.rows[0][0]).toBeNull();
    expect(model.rows[5][0]?.date).toBe("2025-10-25");
    expect(model.rows[5][52]?.date).toBe(TODAY);
    expect(model.rows[6][52]).toBeNull();
  });

  it("can start the week on Sunday", () => {
    const model = recent([], { weekStartsOn: 0 });

    expect(model.weekCount).toBe(53);
    expect(model.rows[6][0]?.date).toBe("2025-10-25");
    expect(model.rows[6][52]?.date).toBe(TODAY);
  });

  it("adds up several sessions in a day and ignores unusable minutes", () => {
    const model = recent([
      { date: "2026-10-20", minutes: 20 },
      { date: "2026-10-20", minutes: 25 },
      { date: "2026-10-21", minutes: 0 },
      { date: "2026-10-22", minutes: -5 },
      { date: "2026-10-23", minutes: Number.NaN },
    ]);

    expect(model.cellByDate.get("2026-10-20")).toMatchObject({
      minutes: 45,
      level: 3,
      future: false,
    });
    expect(model.cellByDate.get("2026-10-21")).toMatchObject({ level: 0 });
    expect(model.totalMinutes).toBe(45);
    expect(model.activeDays).toBe(1);
  });

  it("leaves out days before the window", () => {
    const model = recent([{ date: "2025-10-24", minutes: 60 }]);

    expect(model.cellByDate.has("2025-10-24")).toBe(false);
    expect(model.totalMinutes).toBe(0);
  });

  it("labels months and drops a first label that would overlap the next", () => {
    expect(recent().monthLabels[0]).toEqual({ label: "Nov", weekIndex: 1 });
  });

  it("focuses today first", () => {
    expect(recent().defaultFocusDate).toBe(TODAY);
  });
});

describe("buildHeatmap: calendar year", () => {
  it("covers January to December with padding around the year", () => {
    const model = year(2026);

    expect(model.startDate).toBe("2026-01-01");
    expect(model.endDate).toBe("2026-12-31");
    expect(model.weekCount).toBe(53);
    expect(model.cellByDate.size).toBe(365);
    // 2026-01-01 is a Thursday: row 3 when the week starts on Monday.
    expect(model.rows[2][0]).toBeNull();
    expect(model.rows[3][0]?.date).toBe("2026-01-01");
  });

  it("marks days after today as future, empty and not counted", () => {
    const model = recent([{ date: "2026-10-25", minutes: 90 }], {
      period: { kind: "year", year: 2026 },
    });

    expect(model.cellByDate.get("2026-10-25")).toMatchObject({
      future: true,
      minutes: 0,
      level: 0,
    });
    expect(model.cellByDate.get(TODAY)?.future).toBe(false);
    expect(model.totalMinutes).toBe(0);
    expect(model.activeDays).toBe(0);
  });

  it("labels all 12 months", () => {
    const labels = year(2026).monthLabels;

    expect(labels).toHaveLength(12);
    expect(labels[0]).toEqual({ label: "Jan", weekIndex: 0 });
    expect(labels[1]).toEqual({ label: "Feb", weekIndex: 4 });
  });

  it("focuses the last day of a past year, and today in the current year", () => {
    expect(year(2025).defaultFocusDate).toBe("2025-12-31");
    expect(year(2026).defaultFocusDate).toBe(TODAY);
  });
});

describe("heatmapYears", () => {
  it("lists years from the earliest practice to the current year, newest first", () => {
    expect(heatmapYears([{ date: "2024-05-01", minutes: 10 }], TODAY)).toEqual([
      2026, 2025, 2024,
    ]);
  });

  it("offers only the current year without older data", () => {
    expect(heatmapYears([], TODAY)).toEqual([2026]);
    expect(heatmapYears([{ date: "2026-01-02", minutes: 10 }], TODAY)).toEqual([
      2026,
    ]);
  });
});

describe("moveFocus", () => {
  const model = year(2026);

  it("moves one day with up and down and one week with left and right", () => {
    expect(moveFocus(model, TODAY, "ArrowUp")).toBe("2026-10-23");
    expect(moveFocus(model, TODAY, "ArrowLeft")).toBe("2026-10-17");
    expect(moveFocus(model, "2026-10-17", "ArrowRight")).toBe(TODAY);
    expect(moveFocus(model, "2026-10-23", "ArrowDown")).toBe(TODAY);
  });

  it("does not move into future days or outside the period", () => {
    expect(moveFocus(model, TODAY, "ArrowDown")).toBeNull();
    expect(moveFocus(model, TODAY, "ArrowRight")).toBeNull();
    expect(moveFocus(model, "2026-01-01", "ArrowLeft")).toBeNull();
  });

  it("jumps to the first and last day of the weekday row", () => {
    expect(moveFocus(model, TODAY, "Home")).toBe("2026-01-03");
    expect(moveFocus(model, "2026-01-03", "End")).toBe(TODAY);
  });

  it("ignores other keys and unknown dates", () => {
    expect(moveFocus(model, TODAY, "a")).toBeNull();
    expect(moveFocus(model, "2030-01-01", "ArrowLeft")).toBeNull();
  });
});

describe("invalid input", () => {
  it.each(["2026-02-30", "24/10/2026", ""])("rejects today %j", (today) => {
    expect(() =>
      buildHeatmap({ days: [], dailyGoalMinutes: 30, today }),
    ).toThrow(RangeError);
  });

  it("rejects a malformed practice date", () => {
    expect(() => recent([{ date: "2026-1-5", minutes: 10 }])).toThrow(
      RangeError,
    );
  });

  it("rejects an invalid year", () => {
    expect(() => year(Number.NaN)).toThrow(RangeError);
  });
});
