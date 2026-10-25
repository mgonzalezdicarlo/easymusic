// @vitest-environment node
import { describe, expect, it } from "vitest";

import { calculateStreaks } from "@/server/streaks/streaks";

const MS_PER_DAY = 86_400_000;
const BUENOS_AIRES = "America/Argentina/Buenos_Aires"; // UTC-3, no daylight saving time
const NEW_YORK = "America/New_York";
// 12:00 UTC on 2026-10-24, which is also 2026-10-24 in Buenos Aires.
const NOON = new Date("2026-10-24T12:00:00Z");

/** `length` consecutive dates starting at `start`. */
function run(start: string, length: number) {
  const first = Date.parse(`${start}T00:00:00Z`);

  return Array.from({ length }, (_, index) =>
    new Date(first + index * MS_PER_DAY).toISOString().slice(0, 10),
  );
}

const utc = (dates: string[], now = NOON) =>
  calculateStreaks(dates, "UTC", now);

describe("empty data", () => {
  it("returns zeros and no last practice date", () => {
    expect(utc([])).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalSessions: 0,
      totalActiveDays: 0,
      lastPracticeDate: null,
      practicedToday: false,
    });
  });
});

describe("current streak", () => {
  it("is 1 when only today was practiced", () => {
    expect(utc(["2026-10-24"])).toMatchObject({
      currentStreak: 1,
      longestStreak: 1,
      practicedToday: true,
    });
  });

  it("counts consecutive days ending today", () => {
    expect(utc(run("2026-10-22", 3))).toMatchObject({
      currentStreak: 3,
      longestStreak: 3,
      practicedToday: true,
    });
  });

  it("keeps the streak alive when today has no session yet", () => {
    expect(utc(run("2026-10-22", 2))).toMatchObject({
      currentStreak: 2,
      longestStreak: 2,
      practicedToday: false,
      lastPracticeDate: "2026-10-23",
    });
  });

  it("resets to 0 once a whole day has been missed, but keeps the longest", () => {
    expect(utc(run("2026-10-21", 2))).toMatchObject({
      currentStreak: 0,
      longestStreak: 2,
      lastPracticeDate: "2026-10-22",
    });
  });
});

describe("gaps", () => {
  it("separates runs and reports the longest one", () => {
    const dates = [...run("2026-10-01", 5), ...run("2026-10-23", 2)];

    expect(utc(dates)).toMatchObject({
      currentStreak: 2,
      longestStreak: 5,
      totalActiveDays: 7,
    });
  });

  it("treats a single missing day as a break", () => {
    expect(
      utc(["2026-10-20", "2026-10-21", "2026-10-23", "2026-10-24"]),
    ).toMatchObject({ currentStreak: 2, longestStreak: 2 });
  });

  it("does not depend on the order of the input", () => {
    expect(utc(["2026-10-24", "2026-10-22", "2026-10-23"])).toMatchObject({
      currentStreak: 3,
      longestStreak: 3,
    });
  });

  it("does not change the input", () => {
    const dates = Object.freeze(["2026-10-24", "2026-10-23"]);

    expect(() => calculateStreaks(dates, "UTC", NOON)).not.toThrow();
  });
});

describe("multiple sessions per day", () => {
  it("counts each day once for streaks and every session in the total", () => {
    const dates = [
      "2026-10-24",
      "2026-10-24",
      "2026-10-23",
      "2026-10-23",
      "2026-10-23",
    ];

    expect(utc(dates)).toMatchObject({
      currentStreak: 2,
      longestStreak: 2,
      totalSessions: 5,
      totalActiveDays: 2,
    });
  });
});

describe("future dates", () => {
  it("ignores dates later than today, for example after a timezone change", () => {
    expect(utc(["2026-10-23", "2026-10-25", "2026-10-26"])).toMatchObject({
      currentStreak: 1,
      longestStreak: 1,
      totalSessions: 1,
      totalActiveDays: 1,
      lastPracticeDate: "2026-10-23",
    });
  });
});

describe("timezone boundaries", () => {
  it("decides what today is from the timezone for the same instant", () => {
    // 02:30 UTC on Oct 18 is still Oct 17 in Buenos Aires.
    const instant = new Date("2026-10-18T02:30:00Z");
    const dates = ["2026-10-16"];

    expect(calculateStreaks(dates, BUENOS_AIRES, instant)).toMatchObject({
      currentStreak: 1,
      practicedToday: false,
    });
    expect(calculateStreaks(dates, "UTC", instant)).toMatchObject({
      currentStreak: 0,
      longestStreak: 1,
    });
  });

  it.each([
    ["2026-10-18T02:59:00Z", 2, true],
    ["2026-10-18T03:00:00Z", 2, false],
    ["2026-10-19T02:59:00Z", 2, false],
    ["2026-10-19T03:00:00Z", 0, false],
  ])(
    "at %s in Buenos Aires the streak is %i (practiced today: %s)",
    (instant, currentStreak, practicedToday) => {
      const result = calculateStreaks(
        ["2026-10-16", "2026-10-17"],
        BUENOS_AIRES,
        new Date(instant),
      );

      expect(result.currentStreak).toBe(currentStreak);
      expect(result.practicedToday).toBe(practicedToday);
      expect(result.longestStreak).toBe(2);
    },
  );
});

describe("daylight saving time", () => {
  it("counts days across the spring change (2026-03-08, a 23-hour day) as consecutive", () => {
    const result = calculateStreaks(
      ["2026-03-07", "2026-03-08", "2026-03-09"],
      NEW_YORK,
      new Date("2026-03-09T12:00:00Z"),
    );

    expect(result).toMatchObject({ currentStreak: 3, longestStreak: 3 });
  });

  it("counts days across the autumn change (2026-11-01, a 25-hour day) as consecutive", () => {
    const result = calculateStreaks(
      ["2026-10-31", "2026-11-01", "2026-11-02"],
      NEW_YORK,
      new Date("2026-11-02T12:00:00Z"),
    );

    expect(result).toMatchObject({ currentStreak: 3, longestStreak: 3 });
  });

  it.each([
    ["2026-03-08", "2026-03-09T03:59:00Z", true],
    ["2026-03-08", "2026-03-09T04:00:00Z", false],
    ["2026-11-01", "2026-11-02T04:59:00Z", true],
    ["2026-11-01", "2026-11-02T05:00:00Z", false],
  ])(
    "rolls over at local midnight on the change day: %s at %s",
    (date, instant, practicedToday) => {
      const result = calculateStreaks([date], NEW_YORK, new Date(instant));

      expect(result.practicedToday).toBe(practicedToday);
      // Yesterday's session keeps the streak alive after the rollover.
      expect(result.currentStreak).toBe(1);
    },
  );
});

describe("calendar edges", () => {
  it("continues across a year boundary", () => {
    expect(
      utc(["2023-12-31", "2024-01-01"], new Date("2024-01-01T12:00:00Z")),
    ).toMatchObject({ currentStreak: 2, longestStreak: 2 });
  });

  it("treats Feb 29 as part of the run in a leap year", () => {
    expect(
      utc(
        ["2024-02-28", "2024-02-29", "2024-03-01"],
        new Date("2024-03-01T12:00:00Z"),
      ),
    ).toMatchObject({ currentStreak: 3 });
  });

  it("goes from Feb 28 to Mar 1 in a common year", () => {
    expect(
      utc(["2025-02-28", "2025-03-01"], new Date("2025-03-01T12:00:00Z")),
    ).toMatchObject({ currentStreak: 2 });
  });
});

describe("invalid input", () => {
  it.each(["2026-02-30", "15/01/2026", "2026-1-5", ""])(
    "rejects the date %j",
    (date) => {
      expect(() => utc([date])).toThrow(RangeError);
    },
  );

  it("rejects an unknown timezone", () => {
    expect(() => calculateStreaks([], "Mars/Olympus", NOON)).toThrow(
      RangeError,
    );
  });
});
