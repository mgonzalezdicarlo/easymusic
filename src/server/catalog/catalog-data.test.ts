// @vitest-environment node
import { describe, expect, it } from "vitest";

import { hanonExercises } from "../../../prisma/data/hanon-exercises";
import {
  keySignature,
  scaleCatalog,
  type ScaleModeName,
  scaleModes,
} from "../../../prisma/data/scale-catalog";

const majorTonics = "C Db D Eb E F F# G Ab A Bb B".split(" ");
const minorTonics = "C C# D Eb E F F# G G# A Bb B".split(" ");

function tonicsOf(mode: ScaleModeName) {
  return scaleCatalog
    .filter((scale) => scale.mode === mode)
    .map((scale) => scale.tonic);
}

describe("scaleCatalog", () => {
  it("has 12 tonics in each of the 9 modes, 108 scales in total", () => {
    expect(scaleModes).toHaveLength(9);
    expect(scaleCatalog).toHaveLength(108);

    for (const mode of scaleModes) {
      expect(new Set(tonicsOf(mode)).size).toBe(12);
    }
  });

  it("has no duplicate (tonic, mode) pair", () => {
    const keys = scaleCatalog.map(({ tonic, mode }) => `${tonic}:${mode}`);

    expect(new Set(keys).size).toBe(scaleCatalog.length);
  });

  it("only uses tonic names the database accepts", () => {
    for (const { tonic } of scaleCatalog) {
      expect(tonic).toMatch(/^[A-G][#b]?$/);
    }
  });

  it("spells major keys with the usual 12 names", () => {
    expect(tonicsOf("MAJOR")).toEqual(majorTonics);
  });

  it.each(["NATURAL_MINOR", "HARMONIC_MINOR", "MELODIC_MINOR"] as const)(
    "spells %s with the usual 12 minor key names",
    (mode) => {
      expect(tonicsOf(mode)).toEqual(minorTonics);
    },
  );

  it.each<[string, ScaleModeName]>([
    ["Db", "MAJOR"],
    ["F#", "MAJOR"],
    ["C#", "NATURAL_MINOR"],
    ["Eb", "NATURAL_MINOR"],
    ["Gb", "LYDIAN"],
    ["D#", "PHRYGIAN"],
    ["A#", "LOCRIAN"],
  ])("includes %s %s", (tonic, mode) => {
    expect(scaleCatalog).toContainEqual({ tonic, mode });
  });

  it.each<[string, ScaleModeName]>([
    ["C#", "MAJOR"],
    ["G#", "MAJOR"],
    ["Db", "NATURAL_MINOR"],
  ])("does not include the harder spelling %s %s", (tonic, mode) => {
    expect(scaleCatalog).not.toContainEqual({ tonic, mode });
  });

  it("never needs more than 6 sharps or flats", () => {
    for (const { tonic, mode } of scaleCatalog) {
      expect(Math.abs(keySignature(tonic, mode))).toBeLessThanOrEqual(6);
    }
  });
});

describe("hanonExercises", () => {
  it("has exactly 60 exercises numbered 1 to 60 in order", () => {
    expect(hanonExercises).toHaveLength(60);
    expect(hanonExercises.map(({ number }) => number)).toEqual(
      Array.from({ length: 60 }, (_, index) => index + 1),
    );
  });

  it("titles each exercise Hanon No. <number>", () => {
    for (const { number, title } of hanonExercises) {
      expect(title).toBe(`Hanon No. ${number}`);
    }
  });
});
