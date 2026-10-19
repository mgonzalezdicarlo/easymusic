// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  fromDbDate,
  isSupportedDate,
  todayInTimezone,
  toDbDate,
} from "@/server/sessions/dates";

describe("todayInTimezone", () => {
  const instant = new Date("2026-10-18T02:30:00Z");

  it("returns the calendar date in the given timezone", () => {
    expect(todayInTimezone("UTC", instant)).toBe("2026-10-18");
    expect(todayInTimezone("America/Argentina/Buenos_Aires", instant)).toBe(
      "2026-10-17",
    );
    expect(todayInTimezone("Pacific/Kiritimati", instant)).toBe("2026-10-18");
  });
});

describe("isSupportedDate", () => {
  it.each(["2026-01-15", "2024-02-29", "1900-01-01"])("accepts %s", (value) => {
    expect(isSupportedDate(value)).toBe(true);
  });

  it.each([
    "2026-02-30",
    "2025-02-29",
    "2026-13-01",
    "2026-1-5",
    "15/01/2026",
    "1899-12-31",
    "",
  ])("rejects %j", (value) => {
    expect(isSupportedDate(value)).toBe(false);
  });
});

describe("toDbDate / fromDbDate", () => {
  it("round-trips without shifting the day", () => {
    expect(toDbDate("2026-01-15").toISOString()).toBe(
      "2026-01-15T00:00:00.000Z",
    );
    expect(fromDbDate(toDbDate("2026-01-15"))).toBe("2026-01-15");
  });
});
