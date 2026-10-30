// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  type CatalogScale,
  filterScales,
  groupByKey,
  matchesSearch,
  pitchClass,
  scaleName,
} from "@/features/scales/catalog";

const dbMajor: CatalogScale = { id: "1", tonic: "Db", mode: "MAJOR" };
const scales: CatalogScale[] = [
  { id: "a-minor", tonic: "A", mode: "NATURAL_MINOR" },
  { id: "c#-minor", tonic: "C#", mode: "NATURAL_MINOR" },
  dbMajor,
  { id: "c-major", tonic: "C", mode: "MAJOR" },
];

describe("pitchClass", () => {
  it.each([
    ["C", 0],
    ["C#", 1],
    ["Db", 1],
    ["F#", 6],
    ["Gb", 6],
    ["Bb", 10],
    ["B", 11],
  ])("maps %s to %i", (tonic, expected) => {
    expect(pitchClass(tonic)).toBe(expected);
  });
});

describe("scaleName", () => {
  it("writes the tonic and the lowercase mode", () => {
    expect(scaleName(dbMajor)).toBe("Db major");
    expect(scaleName({ tonic: "A", mode: "NATURAL_MINOR" })).toBe(
      "A natural minor",
    );
  });
});

describe("matchesSearch", () => {
  it.each([
    ["", true],
    ["   ", true],
    ["db", true],
    ["c#", true],
    ["c", false],
    ["b", false],
    ["c# major", true],
    ["maj", true],
    ["minor", false],
  ])("Db major with %j: %s", (query, expected) => {
    expect(matchesSearch(dbMajor, query)).toBe(expected);
  });

  it("matches the start of any word in the mode name", () => {
    const scale: CatalogScale = { id: "2", tonic: "A", mode: "HARMONIC_MINOR" };

    expect(matchesSearch(scale, "harm")).toBe(true);
    expect(matchesSearch(scale, "a min")).toBe(true);
    expect(matchesSearch(scale, "melodic")).toBe(false);
  });
});

describe("filterScales", () => {
  it("combines the mode filter and the search", () => {
    expect(
      filterScales(scales, { search: "", mode: "NATURAL_MINOR" }).map(
        (s) => s.id,
      ),
    ).toEqual(["a-minor", "c#-minor"]);
    expect(
      filterScales(scales, { search: "c", mode: "ALL" }).map((s) => s.id),
    ).toEqual(["c-major"]);
  });
});

describe("groupByKey", () => {
  it("groups by pitch class, from C, and orders each group by mode", () => {
    const groups = groupByKey(scales);

    expect(groups.map((group) => group.label)).toEqual(["C", "C#/Db", "A"]);
    expect(groups[1].scales.map(scaleName)).toEqual([
      "Db major",
      "C# natural minor",
    ]);
  });

  it("returns no groups for no scales", () => {
    expect(groupByKey([])).toEqual([]);
  });
});
