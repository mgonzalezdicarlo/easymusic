// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  startOfMonth,
  startOfWeek,
  weeklyGoal,
} from "@/server/dashboard/dashboard";

describe("startOfWeek", () => {
  it.each([
    ["2026-10-28", "2026-10-26"], // Wednesday
    ["2026-10-26", "2026-10-26"], // Monday
    ["2026-11-01", "2026-10-26"], // Sunday belongs to the week that started on Monday
    ["2026-01-01", "2025-12-29"], // crosses the year boundary
    ["2024-03-01", "2024-02-26"], // crosses a leap day
  ])("%s starts its week on %s", (date, monday) => {
    expect(startOfWeek(date)).toBe(monday);
  });
});

describe("startOfMonth", () => {
  it("returns the first day of the month", () => {
    expect(startOfMonth("2026-10-28")).toBe("2026-10-01");
    expect(startOfMonth("2026-12-31")).toBe("2026-12-01");
  });
});

describe("weeklyGoal", () => {
  it("multiplies the daily goal by seven", () => {
    expect(weeklyGoal(0, 30)).toEqual({
      goalMinutes: 210,
      minutes: 0,
      percent: 0,
      reached: false,
    });
  });

  it("rounds the percentage down", () => {
    expect(weeklyGoal(60, 30).percent).toBe(28);
    expect(weeklyGoal(209, 30)).toMatchObject({ percent: 99, reached: false });
  });

  it("caps the percentage at 100 but keeps the real minutes", () => {
    expect(weeklyGoal(210, 30)).toMatchObject({ percent: 100, reached: true });
    expect(weeklyGoal(500, 30)).toMatchObject({
      minutes: 500,
      percent: 100,
      reached: true,
    });
  });
});
