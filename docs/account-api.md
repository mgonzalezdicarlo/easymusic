# Account API and route protection

## Route protection

`src/proxy.ts` (Next.js 16 `proxy`, ADR-0004) checks the session against the database for every page
route and redirects visitors without one to `/sign-in`. The public pages are `/`, `/sign-in` and
`/sign-up` (`src/lib/route-access.ts`), so a new route is private by default. `/api/*` is skipped:
endpoints answer `401` through `requireUser()`, and server-rendered pages use `requirePageUser()`,
which redirects to `/sign-in`.

## Endpoints

- `GET /api/me` returns `{ name, email, timezone, dailyGoalMinutes, onboarded }`.
- `PATCH /api/me` updates `name`, `timezone` (valid IANA name) and `dailyGoalMinutes` (1 to 1440). It
  also accepts `completeOnboarding: true`, which sets `User.onboardedAt`. At least one field is
  required and unknown fields answer `400`.
- `DELETE /api/me?confirm=true` permanently deletes the user. Without `confirm=true` it answers `400`.

## Rules

- The timezone is read from the database on every write and streak calculation, so a change applies
  to later requests. Stored session dates are never rewritten (ADR-0006).
- Deleting the account removes sessions, accounts, practice sessions, tracked scales and exercises,
  custom exercises and all entries through `ON DELETE CASCADE`, plus verification rows keyed by the
  user's email.
- The first-run prompt (`OnboardingGate` in `src/app/(app)/layout.tsx`) is shown while
  `onboardedAt` is null.
