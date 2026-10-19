# Practice sessions API

Endpoints for practice sessions and the scale and exercise entries inside them. They follow
[api-conventions.md](./api-conventions.md), require a signed-in user (`requireUser()`) and only ever
touch the caller's own data: another user's sessions, entries and tracked items answer `404`.

## Endpoints

- `GET /api/sessions?from=&to=&page=&pageSize=` lists sessions, newest first. `from` and `to` are
  inclusive `YYYY-MM-DD` dates.
- `POST /api/sessions` creates a session: `{ date, durationMinutes?, notes? }`.
- `GET | PATCH | DELETE /api/sessions/{sessionId}` reads, updates (`date`, `durationMinutes`,
  `notes`) or deletes a session. Deleting also deletes its entries.
- `POST /api/sessions/{sessionId}/scale-entries` logs a scale:
  `{ userScaleId, cleanBpm, maxBpm, durationMinutes, notes? }`.
- `PATCH | DELETE /api/sessions/{sessionId}/scale-entries/{entryId}` edits (`cleanBpm`, `maxBpm`,
  `durationMinutes`, `notes`) or deletes an entry.
- `POST /api/sessions/{sessionId}/exercise-entries` and
  `PATCH | DELETE /api/sessions/{sessionId}/exercise-entries/{entryId}` do the same for exercises,
  using `userExerciseId`.

Sessions are returned with their `scaleEntries` and `exerciseEntries`. Adding or editing an entry
returns `{ entry, sessionDurationMinutes }`. Deleting an entry returns `204`, so read the session
again for the new duration.

## Rules

- `date` is a calendar date (`YYYY-MM-DD`, from 1900-01-01) and cannot be later than today in the
  user's timezone (ADR-0006).
- `durationMinutes` is 0 to 1440. `cleanBpm` and `maxBpm` are 20 to 300, with `maxBpm >= cleanBpm`.
  On update, the new value is checked against the stored one.
- `notes` is trimmed, at most 2000 characters, and blank means `null`. `null` clears it on update.
- Unknown body fields are rejected with `400`.

## Session duration

`durationMinutes` is calculated, not stored independently, once a session has entries:

- With at least one entry, it is the sum of the entries' durations, recomputed on every entry add,
  edit and delete. If the sum would exceed 1440, the request fails with `400` and nothing changes.
- With no entries, it is the value set manually through `POST` or `PATCH`. This is what the quick
  "Log practice" flow (E3-03) uses.
- `PATCH`ing `durationMinutes` on a session that has entries returns `409`. Edit or remove entries
  instead.
- Deleting the last entry keeps the last calculated duration. It can then be changed by hand.

Entry writes lock the session row for the transaction, so concurrent writes cannot leave a stale
total.
