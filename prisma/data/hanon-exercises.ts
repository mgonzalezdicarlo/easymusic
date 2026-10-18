export type HanonExerciseSeed = {
  /** Hanon number, 1-60. The database rejects anything else. */
  number: number;
  title: string;
};

// Reference sample used by `npm run db:seed` and by tests. E2-05 completes the set to 1-60.
// To add exercises, append entries in number order. See docs/exercise-catalog.md.
export const hanonExercises: readonly HanonExerciseSeed[] = [
  { number: 1, title: "Hanon No. 1" },
  { number: 2, title: "Hanon No. 2" },
  { number: 3, title: "Hanon No. 3" },
];
