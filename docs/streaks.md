# Streaks

How the current streak, longest streak and practice totals are calculated (E3-04). The rules live
in `src/server/streaks/streaks.ts`, a pure module with no database or React imports. The decisions
about dates follow [ADR-0006](./adr/0006-practice-session-date-storage.md).

## Endpoint

`GET /api/streaks` requires a signed-in user (`requireUser()`) and returns, for that user only:

```json
{
  "data": {
    "currentStreak": 3,
    "longestStreak": 12,
    "totalSessions": 41,
    "totalActiveDays": 30,
    "lastPracticeDate": "2026-10-24",
    "practicedToday": true
  }
}
```

## Rules

1. **A day counts if it has at least one session.** Several sessions on one day count as one day
   for streaks and as several in `totalSessions`.
2. **Dates are local calendar dates.** A streak is a run of consecutive calendar dates. Day
   arithmetic uses UTC midnights, so daylight saving changes never add or remove a day.
3. **The timezone only decides what "today" is.** The server reads `User.timezone` on every call,
   so a change in Settings applies at once. Stored dates are never rewritten.
4. **Today does not break a streak until it ends.** If today has no session yet, the run ending
   yesterday is still the current streak. If neither today nor yesterday has a session, the current
   streak is 0. `practicedToday` tells the UI which of the two cases applies.
5. **The longest streak is the longest run in the whole history** and is never smaller than the
   current streak.
6. **Dates later than today are ignored** (for example after moving to an earlier timezone). They
   count again once they are no longer in the future.
7. **Sessions with 0 minutes are not practice.** The service leaves them out. The pure function only
   sees dates.
8. **Invalid input fails loudly.** A date that is not a real `YYYY-MM-DD` date, or an unknown
   timezone, throws a `RangeError`.

## Rest days (decision)

A configurable rest-day allowance is **not implemented**. It is optional in E3-04, and it changes
what a streak means: results would depend on a setting, and changing the setting would rewrite
history. Rules 1 to 8 are strict: every day between the first and last day of a run has a session.
If it is added later, add an optional parameter to `calculateStreaks`, keep the default strict, and
record the decision in an ADR.

## Tests

`src/server/streaks/streaks.test.ts` covers empty data, gaps, several sessions per day, future
dates, timezone boundaries, daylight saving changes (New York, 2026-03-08 and 2026-11-01), leap
years and invalid input. `src/server/streaks/api.integration.test.ts` covers the endpoint,
including ownership and the stored timezone (`npm run test:integration`).
