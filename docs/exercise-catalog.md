# Exercise catalog

How exercises are modelled and how to add them. The schema is in `prisma/schema.prisma` and the
diagram in [erd.md](./erd.md).

## Model rules

| Source   | Owner    | Number                | Visible to | Changeable by    |
| -------- | -------- | --------------------- | ---------- | ---------------- |
| `HANON`  | none     | required, 1-60        | every user | nobody (catalog) |
| `CZERNY` | one user | optional study number | the owner  | the owner        |
| `CUSTOM` | one user | optional              | the owner  | the owner        |

- The database enforces the owner rule (`exercises_source_owner_check`), so a user can never own a
  catalog exercise.
- Visibility and write access are enforced in queries. Use `visibleExercisesWhere` for reads and
  `ownedExercisesWhere` for updates and deletes (`src/server/exercises/access.ts`).
- There is one `HANON` row per number (partial unique index). A user cannot own two exercises with
  the same source and number.
- BPM rules match scale entries: `cleanBpm` and `maxBpm` between 20 and 300, `maxBpm >= cleanBpm`.
- Czerny studies are created by users, not seeded. Put the opus in the title (for example
  "Op. 299 No. 1") and the study number in `number`.
- Deleting an exercise also deletes its tracking and practice history. The app never deletes
  catalog rows. For custom exercises, the API must ask for confirmation or archive the tracked
  exercise instead.

## Seeding the Hanon catalog

`npm run db:seed` loads all 60 Hanon exercises from `prisma/data/hanon-exercises.ts`. Titles are
derived from the number ("Hanon No. 7"). It is safe to run repeatedly: new rows are inserted,
existing rows get their title updated, and nothing is duplicated (rows use the stable id
`hanon-<number>`). After seeding, the script checks that the database holds exactly 60 catalog
exercises and fails if it does not. Inspect the `exercises` table with `npm run db:studio`.

To rename exercises, change how titles are built in the data file and seed again. Removing a
catalog exercise is not done by the seed and needs a migration.

A catalog for another source (for example Czerny) needs a migration that relaxes
`exercises_source_owner_check`, plus an update to this document.
