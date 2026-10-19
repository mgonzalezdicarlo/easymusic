/** Scale modes in the catalog. The names match the `ScaleMode` enum in prisma/schema.prisma. */
export const scaleModes = [
  "MAJOR",
  "NATURAL_MINOR",
  "HARMONIC_MINOR",
  "MELODIC_MINOR",
  "DORIAN",
  "PHRYGIAN",
  "LYDIAN",
  "MIXOLYDIAN",
  "LOCRIAN",
] as const;

export type ScaleModeName = (typeof scaleModes)[number];

export type ScaleSeed = { tonic: string; mode: ScaleModeName };

// Position of each tonic name on the circle of fifths: C is 0, sharps are positive, flats negative.
const fifthsByTonic: Record<string, number> = {
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
  "F#": 6,
  "C#": 7,
  "G#": 8,
  "D#": 9,
  "A#": 10,
  F: -1,
  Bb: -2,
  Eb: -3,
  Ab: -4,
  Db: -5,
  Gb: -6,
};

// Key signature of a scale = position of its tonic + this offset (the parent major key).
// Harmonic and melodic minor use the natural minor signature.
const signatureOffset: Record<ScaleModeName, number> = {
  LYDIAN: 1,
  MAJOR: 0,
  MIXOLYDIAN: -1,
  DORIAN: -2,
  NATURAL_MINOR: -3,
  HARMONIC_MINOR: -3,
  MELODIC_MINOR: -3,
  PHRYGIAN: -4,
  LOCRIAN: -5,
};

// The 12 pitch classes from C. The first name is the preferred spelling. See docs/scale-catalog.md.
const chromaticTonics = [
  ["C"],
  ["Db", "C#"],
  ["D"],
  ["Eb", "D#"],
  ["E"],
  ["F"],
  ["F#", "Gb"],
  ["G"],
  ["Ab", "G#"],
  ["A"],
  ["Bb", "A#"],
  ["B"],
] as const;

/** Signed key signature of a scale: sharps are positive, flats negative. */
export function keySignature(tonic: string, mode: ScaleModeName): number {
  return fifthsByTonic[tonic] + signatureOffset[mode];
}

function chooseTonic(
  spellings: readonly string[],
  mode: ScaleModeName,
): string {
  const [preferred, ...alternatives] = spellings;
  const accidentals = (tonic: string) => Math.abs(keySignature(tonic, mode));

  // Strictly fewer accidentals wins, so a tie keeps the preferred spelling.
  return alternatives.reduce(
    (best, candidate) =>
      accidentals(candidate) < accidentals(best) ? candidate : best,
    preferred,
  );
}

/** Every tonic in every supported mode: 12 x 9 = 108 scales, in chromatic order per mode. */
export const scaleCatalog: readonly ScaleSeed[] = chromaticTonics.flatMap(
  (spellings) =>
    scaleModes.map((mode) => ({ tonic: chooseTonic(spellings, mode), mode })),
);
