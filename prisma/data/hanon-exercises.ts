export type HanonExerciseSeed = {
  /** Hanon number, 1-60. The database rejects anything else. */
  number: number;
  title: string;
};

/** Hanon's "The Virtuoso Pianist" has exactly 60 exercises. */
export const HANON_COUNT = 60;

// The complete catalog used by `npm run db:seed` and by tests. Titles are derived from the number.
// See docs/exercise-catalog.md.
export const hanonExercises: readonly HanonExerciseSeed[] = Array.from(
  { length: HANON_COUNT },
  (_, index) => ({ number: index + 1, title: `Hanon No. ${index + 1}` }),
);
