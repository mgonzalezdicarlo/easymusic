// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  formatMinutes,
  formatSessionDate,
  isRealDate,
  sessionFormSchema,
  todayInTimezone,
} from "@/lib/practice-session";

describe("todayInTimezone", () => {
  it("returns the calendar date in the given timezone", () => {
    const instant = new Date("2026-10-18T02:30:00Z");

    expect(todayInTimezone("UTC", instant)).toBe("2026-10-18");
    expect(todayInTimezone("America/Argentina/Buenos_Aires", instant)).toBe(
      "2026-10-17",
    );
  });
});

describe("isRealDate", () => {
  it.each(["2026-01-15", "2024-02-29"])("accepts %s", (value) => {
    expect(isRealDate(value)).toBe(true);
  });

  it.each(["2026-02-30", "2025-02-29", "2026-1-5", "15/01/2026", ""])(
    "rejects %j",
    (value) => {
      expect(isRealDate(value)).toBe(false);
    },
  );
});

describe("formatters", () => {
  it("formats a calendar date without shifting the day", () => {
    expect(formatSessionDate("2026-01-15")).toBe("Thu, Jan 15, 2026");
  });

  it("formats minutes", () => {
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(60)).toBe("1 h");
    expect(formatMinutes(75)).toBe("1 h 15 min");
  });
});

describe("sessionFormSchema", () => {
  const schema = sessionFormSchema("2026-10-24");
  const valid = { date: "2026-10-24", durationMinutes: 30, notes: "  Scales " };

  function messages(input: unknown, options?: { durationLocked?: boolean }) {
    const result = sessionFormSchema("2026-10-24", options).safeParse(input);

    return result.success ? [] : result.error.issues.map((i) => i.message);
  }

  it("accepts today and past dates, and trims the notes", () => {
    expect(schema.parse(valid)).toEqual({ ...valid, notes: "Scales" });
    expect(schema.safeParse({ ...valid, date: "2026-01-15" }).success).toBe(
      true,
    );
  });

  it.each(["2026-10-25", "2999-01-01"])(
    "rejects the future date %s",
    (date) => {
      expect(messages({ ...valid, date })).toContain(
        "Date cannot be in the future.",
      );
    },
  );

  it.each(["", "15/01/2026", "2026-02-30", "1899-12-31"])(
    "rejects the invalid date %j",
    (date) => {
      expect(messages({ ...valid, date }).length).toBeGreaterThan(0);
    },
  );

  it.each([0, 1441, 1.5, Number.NaN])(
    "rejects %s minutes",
    (durationMinutes) => {
      expect(messages({ ...valid, durationMinutes }).length).toBeGreaterThan(0);
    },
  );

  it("allows 0 minutes only when the duration is locked", () => {
    expect(
      messages({ ...valid, durationMinutes: 0 }, { durationLocked: true }),
    ).toEqual([]);
  });
});
