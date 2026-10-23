import { z } from "zod";

// Shared by the settings forms (client) and the profile API (server).
export const MIN_DAILY_GOAL_MINUTES = 1;
export const MAX_DAILY_GOAL_MINUTES = 1440;
export const MAX_NAME_LENGTH = 100;

/** True for a timezone name the runtime accepts, such as "America/Argentina/Buenos_Aires". */
export function isValidTimezone(value: string): boolean {
  if (!/^[A-Za-z][A-Za-z0-9_+\-/]*$/.test(value)) return false;

  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name.")
  .max(MAX_NAME_LENGTH, `Use at most ${MAX_NAME_LENGTH} characters.`);

export const timezoneSchema = z
  .string()
  .trim()
  .refine(isValidTimezone, "Choose a valid timezone.");

export const dailyGoalSchema = z
  .number({ error: "Enter a whole number of minutes." })
  .int("Enter a whole number of minutes.")
  .min(MIN_DAILY_GOAL_MINUTES, `Use at least ${MIN_DAILY_GOAL_MINUTES} minute.`)
  .max(
    MAX_DAILY_GOAL_MINUTES,
    `Use at most ${MAX_DAILY_GOAL_MINUTES} minutes (one day).`,
  );

export const profileSchema = z.object({
  name: nameSchema,
  timezone: timezoneSchema,
  dailyGoalMinutes: dailyGoalSchema,
});

export const onboardingSchema = profileSchema.omit({ name: true });

/** Converts the text of a number input. Blank becomes NaN, which the schema rejects. */
export function parseGoalInput(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}
