# Tracked scales and exercises API

Endpoints for tracking catalog scales and exercises, and for managing custom exercises. They follow
[api-conventions.md](./api-conventions.md), require a signed-in user (`requireUser()`) and only
touch the caller's own data. Another user's tracked items and custom exercises answer `404`.

## Endpoints

Scales

- `GET /api/scales?tonic=&mode=&page=&pageSize=` lists the shared catalog, ordered by mode, then
  tonic. `tonic` matches the stored spelling (for example `Db`, not `C#`, for major).
- `GET /api/user-scales?status=` lists the user's tracked scales.
- `POST /api/user-scales` tracks a scale: `{ scaleId, octaves (1-4), handsMode, targetBpm (20-300) }`.
- `PATCH /api/user-scales/{userScaleId}` changes `octaves`, `handsMode`, `targetBpm` or `status`.
- `DELETE /api/user-scales/{userScaleId}` stops tracking.

Exercises

- `GET /api/exercises?source=&search=&page=&pageSize=` lists the shared catalog (Hanon) plus the
  user's own exercises. `search` matches the title (case-insensitive). A numeric search also
  matches the exercise number.
- `POST /api/exercises` creates a custom exercise:
  `{ source: "CZERNY" | "CUSTOM", title, number?, description?, targetBpm? }`.
- `PATCH | DELETE /api/exercises/{exerciseId}` edits (same fields, all optional, `null` clears
  `number`, `description` and `targetBpm`) or deletes the user's own exercise.
- `GET /api/user-exercises?status=` lists the user's tracked exercises.
- `POST /api/user-exercises` tracks a catalog or own exercise: `{ exerciseId, targetBpm }`.
- `PATCH | DELETE /api/user-exercises/{userExerciseId}` changes `targetBpm` or `status`, or stops
  tracking.

Tracked items are returned with their `scale` or `exercise`.

## Rules

- Tracking the same scale configuration `(scale, octaves, handsMode)` twice, tracking the same
  exercise twice, or a custom exercise with an existing `(source, number)` answers `409`.
  A `PATCH` that would create a duplicate also answers `409`.
- Catalog exercises (`HANON`) can be tracked but never changed or deleted: `403`.
- The scale and exercise of a tracked item cannot change. Unknown ids answer `404`.
- Unknown body fields are rejected with `400`.

## Deleting and history

Deleting a tracked scale, a tracked exercise or a custom exercise also deletes its practice entries
(and, for a custom exercise, its tracking). When history exists, `DELETE` answers `409` unless the
request has `?confirm=true`. To keep the history, `PATCH` the tracked item with
`{ "status": "ARCHIVED" }` instead.
