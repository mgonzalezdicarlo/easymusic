# Logging scale practice

How scale practice is logged (E4-03). Entry rules match [sessions-api.md](./sessions-api.md).

## Endpoint

`POST /api/scale-practice` with `{ entries: [{ userScaleId, cleanBpm, maxBpm, durationMinutes, notes? }] }`
(1 to 20 entries) logs several scales at once and answers `201` with
`{ sessionId, createdSession, sessionDurationMinutes, entries }`. It requires a signed-in user.

## Rules

1. Entries go into **today's session**, where today follows `User.timezone` (ADR-0006).
2. The session used is the newest one today that already has entries or is an empty 0-minute
   session. If there is none, a new session is created. A session with a manual duration and no
   entries is never reused, because its minutes would be replaced by the entries' sum.
3. The session duration becomes the sum of its entries, so the day counts for the heat map and
   the streak. Entries need at least 1 minute here, and a day total above 1440 answers `400`.
4. `cleanBpm` and `maxBpm` are 20 to 300 and `maxBpm >= cleanBpm`. Errors are reported per entry
   as `entries.<index>.<field>`.
5. Setups of other users answer `404`. Archived setups answer `409`.
6. Everything happens in one transaction: if any entry fails, nothing is saved.

## UI

- The "Log practice" dialog has a **Scales** tab. Each chosen scale is prefilled with its last
  clean BPM, max BPM and minutes.
- The Scales page lists the latest entries with edit and delete, using the existing
  `PATCH | DELETE /api/sessions/{sessionId}/scale-entries/{entryId}` endpoints.
- Deleting the last entry of a session keeps the session's last calculated minutes.
