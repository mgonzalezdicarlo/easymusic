// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  dailyGoalSchema,
  isValidTimezone,
  onboardingSchema,
  parseGoalInput,
  profileSchema,
} from "@/lib/user-preferences";

describe("isValidTimezone", () => {
  it.each([
    "UTC",
    "America/Argentina/Buenos_Aires",
    "Pacific/Kiritimati",
    "Etc/GMT+3",
  ])("accepts %s", (value) => {
    expect(isValidTimezone(value)).toBe(true);
  });

  it.each(["", "Mars/Olympus", "+05:00", "not a zone"])(
    "rejects %j",
    (value) => {
      expect(isValidTimezone(value)).toBe(false);
    },
  );
});

describe("dailyGoalSchema", () => {
  it.each([1, 30, 1440])("accepts %i", (value) => {
    expect(dailyGoalSchema.safeParse(value).success).toBe(true);
  });

  it.each([0, 1441, 1.5, Number.NaN, -5])("rejects %s", (value) => {
    expect(dailyGoalSchema.safeParse(value).success).toBe(false);
  });
});

describe("parseGoalInput", () => {
  it("parses numbers and turns blank text into NaN", () => {
    expect(parseGoalInput(" 45 ")).toBe(45);
    expect(parseGoalInput("   ")).toBeNaN();
  });
});

describe("profileSchema", () => {
  it("trims the name and timezone", () => {
    expect(
      profileSchema.parse({
        name: "  Ada ",
        timezone: " UTC ",
        dailyGoalMinutes: 30,
      }),
    ).toEqual({ name: "Ada", timezone: "UTC", dailyGoalMinutes: 30 });
  });

  it("does not require a name during onboarding", () => {
    expect(
      onboardingSchema.safeParse({ timezone: "UTC", dailyGoalMinutes: 30 })
        .success,
    ).toBe(true);
  });
});
