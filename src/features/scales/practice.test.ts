// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  type EntryRow,
  type LoggableScale,
  mapFailure,
  newRow,
  parseEntryRows,
  sortLoggable,
} from "@/features/scales/practice";

const cMajor: LoggableScale = {
  id: "c2",
  tonic: "C",
  mode: "MAJOR",
  octaves: 2,
  handsMode: "TOGETHER",
  targetBpm: 120,
  last: { cleanBpm: 80, maxBpm: 96, durationMinutes: 10 },
};
const aMinor: LoggableScale = {
  id: "a1",
  tonic: "A",
  mode: "NATURAL_MINOR",
  octaves: 1,
  handsMode: "SEPARATE",
  targetBpm: 90,
  last: null,
};
const dbMajor: LoggableScale = { ...cMajor, id: "db", tonic: "Db", last: null };

describe("sortLoggable", () => {
  it("orders by key from C, then mode, octaves and hands", () => {
    const cMajor4 = { ...cMajor, id: "c4", octaves: 4 };
    const cMinor = { ...aMinor, id: "cm", tonic: "C" };

    expect(
      sortLoggable([aMinor, dbMajor, cMajor4, cMinor, cMajor]).map((s) => s.id),
    ).toEqual(["c2", "c4", "cm", "db", "a1"]);
  });
});

describe("newRow", () => {
  it("prefills from the last entry, without notes", () => {
    expect(newRow(cMajor, "1")).toEqual({
      key: "1",
      userScaleId: "c2",
      cleanBpm: "80",
      maxBpm: "96",
      duration: "10",
      notes: "",
    });
  });

  it("starts blank without history", () => {
    expect(newRow(aMinor, "2")).toMatchObject({
      cleanBpm: "",
      maxBpm: "",
      duration: "",
    });
  });
});

describe("parseEntryRows", () => {
  const ok: EntryRow = newRow(cMajor, "1");

  it("builds the request body for valid rows", () => {
    expect(parseEntryRows([ok])).toEqual({
      ok: true,
      entries: [
        {
          userScaleId: "c2",
          cleanBpm: 80,
          maxBpm: 96,
          durationMinutes: 10,
          notes: null,
        },
      ],
    });
  });

  it("reports the errors of each invalid row by key", () => {
    const bad = {
      ...newRow(aMinor, "2"),
      cleanBpm: "100",
      maxBpm: "90",
      duration: "5",
    };
    const result = parseEntryRows([ok, bad]);

    expect(result).toEqual({
      ok: false,
      errors: {
        "2": { maxBpm: "Max BPM must be greater than or equal to clean BPM." },
      },
    });
  });
});

describe("mapFailure", () => {
  const rows = [newRow(cMajor, "k1"), newRow(aMinor, "k2")];

  it("maps entries.<index>.<field> to the row and keeps the rest as a form message", () => {
    expect(
      mapFailure(
        {
          formError: null,
          fieldErrors: {
            "entries.1.maxBpm": "Too low.",
            durationMinutes: "Too long a day.",
          },
        },
        rows,
      ),
    ).toEqual({
      rowErrors: { k2: { maxBpm: "Too low." } },
      formError: "Too long a day.",
    });
  });

  it("passes a plain form error through", () => {
    expect(
      mapFailure(
        { formError: "Tracked scale not found.", fieldErrors: {} },
        rows,
      ),
    ).toEqual({ rowErrors: {}, formError: "Tracked scale not found." });
  });
});
