# Scale catalog

How the scale catalog is generated and seeded. The schema is in `prisma/schema.prisma` and the
diagram in [erd.md](./erd.md).

## Contents

One row per tonic and mode: 12 tonics x 9 modes = 108 scales. The catalog is shared by every user
and read-only in the app. The modes are the `ScaleMode` enum values `MAJOR`, `NATURAL_MINOR`,
`HARMONIC_MINOR`, `MELODIC_MINOR`, `DORIAN`, `PHRYGIAN`, `LYDIAN`, `MIXOLYDIAN` and `LOCRIAN`.

## Enharmonic spelling

Five tonics have two names (C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb). Each scale is stored once, under
one name, so there are never two rows for the same scale. The name is chosen per mode:

1. Start from the usual major-key names: C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B.
2. Use the other name only if its key signature has strictly fewer sharps or flats. A tie keeps the
   usual name.
3. Harmonic and melodic minor use the key signature of the natural minor on the same tonic.

No scale needs more than 6 sharps or flats. Result, in chromatic order from C:

- Major and Mixolydian: C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B
- Natural, harmonic and melodic minor: C, C#, D, Eb, E, F, F#, G, G#, A, Bb, B
- Dorian: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B
- Phrygian: C, C#, D, D#, E, F, F#, G, G#, A, Bb, B
- Lydian: C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B
- Locrian: C, C#, D, D#, E, F, F#, G, G#, A, A#, B

## Seeding

`npm run db:seed` upserts every scale by its natural key (`tonic`, `mode`), so it can be run any
number of times without creating duplicates. Afterwards it checks that the database holds exactly
108 scales and 60 Hanon exercises, and fails otherwise. The seed never deletes rows, so changing an
existing spelling needs a migration.

The list is generated in `prisma/data/scale-catalog.ts`. To add a mode, add it to the `ScaleMode`
enum (with a migration), to `scaleModes` and to `signatureOffset`, then update the expected counts
in `src/server/catalog/catalog-data.test.ts`.
