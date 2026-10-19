// Date helpers for practice sessions (ADR-0006). In application code a session date is a
// `YYYY-MM-DD` string. Prisma represents the `DATE` column as a Date at UTC midnight.

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Earliest session date the API accepts. */
export const MIN_SESSION_DATE = "1900-01-01";

export function toDbDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function fromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** True for a real calendar date written as YYYY-MM-DD, on or after MIN_SESSION_DATE. */
export function isSupportedDate(value: string): boolean {
  if (!DATE_ONLY.test(value) || value < MIN_SESSION_DATE) return false;

  const date = toDbDate(value);

  return !Number.isNaN(date.getTime()) && fromDbDate(date) === value;
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
