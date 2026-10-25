import { z } from "zod";

// Client-side mirror of the practice session rules enforced by src/server/sessions (ADR-0006).
// The API stays the authority and validates every request again, including the future-date rule.
export const MIN_SESSION_DATE = "1900-01-01";
export const MAX_SESSION_MINUTES = 1440;
export const MAX_SESSION_NOTES_LENGTH = 2000;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date written as YYYY-MM-DD. */
export function isRealDate(value: string): boolean {
  if (!DATE_ONLY.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/** The calendar date (YYYY-MM-DD) that `now` falls on in the given IANA timezone. */
export function todayInTimezone(
  timeZone: string,
  now: Date = new Date(),
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

// Fixed locale and timezone, so the server and the browser render the same text.
const dateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "2026-01-15" becomes "Thu, Jan 15, 2026". */
export function formatSessionDate(value: string): string {
  return dateFormat.format(new Date(`${value}T00:00:00.000Z`));
}

/** 45 becomes "45 min", 75 becomes "1 h 15 min". */
export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;

  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

/**
 * Form rules for logging or editing a session. `today` is the user's current date, so the
 * future-date rule follows their timezone. When the duration is calculated from entries it is
 * shown but not edited, so it may be 0.
 */
export function sessionFormSchema(
  today: string,
  options: { durationLocked?: boolean } = {},
) {
  return z.object({
    date: z
      .string()
      .min(1, "Choose a date.")
      .refine(isRealDate, "Use a real date.")
      .refine(
        (value) => value >= MIN_SESSION_DATE,
        `Use a date on or after ${MIN_SESSION_DATE}.`,
      )
      .refine((value) => value <= today, "Date cannot be in the future."),
    durationMinutes: z
      .number({ error: "Enter a whole number of minutes." })
      .int("Enter a whole number of minutes.")
      .min(options.durationLocked ? 0 : 1, "Enter at least 1 minute.")
      .max(
        MAX_SESSION_MINUTES,
        `Use at most ${MAX_SESSION_MINUTES} minutes (one day).`,
      ),
    notes: z
      .string()
      .trim()
      .max(
        MAX_SESSION_NOTES_LENGTH,
        `Use at most ${MAX_SESSION_NOTES_LENGTH} characters.`,
      ),
  });
}

export type SessionFormValues = z.output<ReturnType<typeof sessionFormSchema>>;
