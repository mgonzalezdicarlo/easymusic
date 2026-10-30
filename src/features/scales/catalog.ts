// Pure rules for the scale catalog browser (E4-01). No React or server imports, so they can be
// unit tested. The catalog stores each scale once under one tonic spelling
// (docs/scale-catalog.md), so keys are grouped by pitch class: Db major and C# natural minor
// share the "C#/Db" group.

/** Same values and order as the `ScaleMode` enum in prisma/schema.prisma. */
export const SCALE_MODES = [
  { value: "MAJOR", label: "Major" },
  { value: "NATURAL_MINOR", label: "Natural minor" },
  { value: "HARMONIC_MINOR", label: "Harmonic minor" },
  { value: "MELODIC_MINOR", label: "Melodic minor" },
  { value: "DORIAN", label: "Dorian" },
  { value: "PHRYGIAN", label: "Phrygian" },
  { value: "LYDIAN", label: "Lydian" },
  { value: "MIXOLYDIAN", label: "Mixolydian" },
  { value: "LOCRIAN", label: "Locrian" },
] as const;

export type ScaleModeValue = (typeof SCALE_MODES)[number]["value"];

export const ALL_MODES = "ALL" as const;
export type ModeFilter = ScaleModeValue | typeof ALL_MODES;

export type CatalogScale = { id: string; tonic: string; mode: ScaleModeValue };

export type KeyGroup = {
  pitchClass: number;
  label: string;
  scales: CatalogScale[];
};

const MODE_LABELS = Object.fromEntries(
  SCALE_MODES.map(({ value, label }) => [value, label] as const),
) as Record<ScaleModeValue, string>;

const MODE_ORDER = new Map(
  SCALE_MODES.map(({ value }, index) => [value, index] as const),
);

// Chromatic order from C. Each entry lists every spelling of that pitch class.
const KEY_SPELLINGS: readonly (readonly string[])[] = [
  ["C"],
  ["C#", "Db"],
  ["D"],
  ["D#", "Eb"],
  ["E"],
  ["F"],
  ["F#", "Gb"],
  ["G"],
  ["G#", "Ab"],
  ["A"],
  ["A#", "Bb"],
  ["B"],
];

const NATURAL_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

// A search word such as "c", "f#" or "bb" is a note name and must match a tonic exactly.
const NOTE_TOKEN = /^[a-g][#b]?$/;

/** 0 (C) to 11 (B) for a tonic such as "C", "F#" or "Bb". */
export function pitchClass(tonic: string): number {
  const shift = tonic.endsWith("#") ? 1 : tonic.endsWith("b") ? -1 : 0;

  return (NATURAL_SEMITONES[tonic[0]] + shift + 12) % 12;
}

/** "C#/Db" for pitch class 1. */
export function keyLabel(key: number): string {
  return KEY_SPELLINGS[key].join("/");
}

export function modeLabel(mode: ScaleModeValue): string {
  return MODE_LABELS[mode];
}

/** "Db major", "A natural minor". */
export function scaleName({
  tonic,
  mode,
}: Pick<CatalogScale, "tonic" | "mode">): string {
  return `${tonic} ${modeLabel(mode).toLowerCase()}`;
}

function matchesToken(scale: CatalogScale, token: string): boolean {
  if (NOTE_TOKEN.test(token)) {
    return KEY_SPELLINGS[pitchClass(scale.tonic)].some(
      (name) => name.toLowerCase() === token,
    );
  }

  return modeLabel(scale.mode)
    .toLowerCase()
    .split(" ")
    .some((word) => word.startsWith(token));
}

/**
 * Every word of the query must match: note names match a tonic (either enharmonic spelling),
 * other words match the start of a word in the mode name. A blank query matches everything.
 */
export function matchesSearch(scale: CatalogScale, query: string): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  return tokens.every((token) => matchesToken(scale, token));
}

export function filterScales(
  scales: readonly CatalogScale[],
  { search, mode }: { search: string; mode: ModeFilter },
): CatalogScale[] {
  return scales.filter(
    (scale) =>
      (mode === ALL_MODES || scale.mode === mode) &&
      matchesSearch(scale, search),
  );
}

function compareScales(a: CatalogScale, b: CatalogScale): number {
  return (
    (MODE_ORDER.get(a.mode) ?? 0) - (MODE_ORDER.get(b.mode) ?? 0) ||
    a.tonic.localeCompare(b.tonic)
  );
}

/** Groups scales by pitch class (C first), and orders each group by mode. */
export function groupByKey(scales: readonly CatalogScale[]): KeyGroup[] {
  const byKey = new Map<number, CatalogScale[]>();

  for (const scale of scales) {
    const key = pitchClass(scale.tonic);
    const group = byKey.get(key);

    if (group) group.push(scale);
    else byKey.set(key, [scale]);
  }

  return [...byKey.entries()]
    .sort(([a], [b]) => a - b)
    .map(([key, group]) => ({
      pitchClass: key,
      label: keyLabel(key),
      scales: group.sort(compareScales),
    }));
}
