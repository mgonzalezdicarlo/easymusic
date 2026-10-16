# ADR-0006: Store practice session dates as local calendar dates

- **Status:** Proposed
- **Date:** 2026-10-16

## Context

The heat map, streaks and weekly goals all work in whole days as the pianist experiences them. A
session logged at 23:30 in Buenos Aires (UTC-3) belongs to that evening's date, not to the next day
in UTC. Storing an instant (`timestamptz`) would force every query to convert it back to a date with
the user's timezone, and the result would shift if the user changes timezone. Backfilled sessions
have no meaningful time of day at all.

## Decision

- `PracticeSession.date` is a PostgreSQL `DATE` (`@db.Date` in Prisma): the calendar date, in the
  user's timezone, that the practice belongs to. It has no time of day and is never converted.
- `User.timezone` holds an IANA name such as `America/Argentina/Buenos_Aires` (default `UTC`). It is
  only used to decide what "today" is and where weeks and months start. Changing it never rewrites
  stored dates.
- In application code a date is a `YYYY-MM-DD` string. Prisma represents a `DATE` as a JavaScript
  `Date` at UTC midnight, so read it with `toISOString().slice(0, 10)` and build it from a
  `YYYY-MM-DD` string plus a `T00:00:00.000Z` suffix. Never use local-time methods (`getDate`,
  `setHours`) on these values.
- Several sessions per day are allowed. `(userId, date)` has a non-unique composite index that
  serves date-range queries and per-day aggregation. The streak service counts each date once.
- `createdAt` is the UTC instant a row was written. It is for auditing only and never feeds the heat
  map or streaks.
- Rules that depend on the timezone are enforced in the API with Zod, not in the database: the date
  must not be later than today in the user's timezone, and the timezone must be a valid IANA name.
  Range rules that do not depend on it are `CHECK` constraints added by hand in the migration:
  `PracticeSession.durationMinutes` between 0 and 1440, and `User.dailyGoalMinutes` between 1 and 1440.

## Consequences

- Heat map, streak and weekly queries group by `date` directly, with no timezone math in SQL.
- Stored history is stable when the user travels or changes timezone.
- The server must compute "today" from `User.timezone` on every write and streak calculation.
- Prisma cannot declare `CHECK` constraints (see ADR-0003), so the migration contains hand-written
  SQL and the same rules are validated with Zod at the API boundary.
- Better Auth's own `user` fields are merged into `User` in Epic 3 (see ADR-0004).

## Alternatives considered

- **`timestamptz` converted at query time:** keeps the exact moment, but every aggregation depends
  on the timezone at query time and results change when it changes.
- **UTC date plus a stored offset:** reproduces the local date, but adds a second column that must
  stay consistent and complicates every query.
- **One session per user per day (unique `(userId, date)`):** simpler streaks, but it blocks logging
  a morning and an evening session separately, which the streak tests in E3-04 also expect.
