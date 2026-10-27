# Dashboard

How the dashboard numbers are calculated (E3-06). The pure rules are in
`src/server/dashboard/dashboard.ts` and the data loading in `src/server/dashboard/service.ts`.

## Cards

- **Current and longest streak** come from the streak service ([streaks.md](./streaks.md)), so they
  always match the `GET /api/streaks` numbers.
- **Minutes this week** is the sum of session durations from this week's Monday up to today.
- **Sessions this month** counts sessions from the first of the month up to today.
- **Weekly goal** is `User.dailyGoalMinutes` times 7, compared with the minutes this week. The bar
  is capped at 100 %, and the minutes shown are the real total.

## Rules

1. "Today", the week and the month follow `User.timezone`, read on every request (ADR-0006).
2. Weeks run Monday to Sunday.
3. Like the streak service, sessions with 0 minutes and dates later than today are ignored.
4. A user without counted sessions sees a welcome card with a "Log practice" button instead of
   cards full of zeros.
5. The summary and the recent sessions list load in separate `Suspense` boundaries, in parallel.
   Logging, editing or deleting a session refreshes the page data.
