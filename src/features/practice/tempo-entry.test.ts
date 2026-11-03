// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  changedTempoFields,
  parseTempoDraft,
  TEMPO_ORDER_MESSAGE,
  toEntryPayload,
} from "@/features/practice/tempo-entry";

const valid = { cleanBpm: "80", maxBpm: "96", duration: "10", notes: " Slow " };

function errorsOf(extra: object) {
  const result = parseTempoDraft({ ...valid, ...extra });

  return result.success ? {} : result.errors;
}

describe("parseTempoDraft", () => {
  it("parses a valid draft and trims the notes", () => {
    expect(parseTempoDraft(valid)).toEqual({
      success: true,
      data: { cleanBpm: 80, maxBpm: 96, durationMinutes: 10, notes: "Slow" },
    });
  });

  it("accepts equal tempos and the limits of the range", () => {
    expect(
      parseTempoDraft({ ...valid, cleanBpm: "20", maxBpm: "20" }).success,
    ).toBe(true);
    expect(
      parseTempoDraft({ ...valid, cleanBpm: "300", maxBpm: "300" }).success,
    ).toBe(true);
  });

  it("blocks a max tempo below the clean tempo", () => {
    expect(errorsOf({ maxBpm: "79" })).toEqual({ maxBpm: TEMPO_ORDER_MESSAGE });
  });

  it.each([
    [
      { cleanBpm: "" },
      "cleanBpm",
      "Enter the clean tempo as a whole number of BPM.",
    ],
    [
      { maxBpm: "abc" },
      "maxBpm",
      "Enter the max tempo as a whole number of BPM.",
    ],
    [
      { cleanBpm: "80.5" },
      "cleanBpm",
      "Enter the clean tempo as a whole number of BPM.",
    ],
    [{ cleanBpm: "19", maxBpm: "50" }, "cleanBpm", "Use at least 20 BPM."],
    [{ maxBpm: "301" }, "maxBpm", "Use at most 300 BPM."],
    [{ duration: "0" }, "durationMinutes", "Enter at least 1 minute."],
    [
      { duration: "1441" },
      "durationMinutes",
      "Use at most 1440 minutes (one day).",
    ],
    [{ notes: "x".repeat(2001) }, "notes", "Use at most 2000 characters."],
  ])("rejects %j", (extra, field, message) => {
    expect(errorsOf(extra)).toMatchObject({ [field]: message });
  });
});

describe("toEntryPayload", () => {
  it("turns blank notes into null", () => {
    const result = parseTempoDraft({ ...valid, notes: "   " });

    expect(result.success && toEntryPayload(result.data).notes).toBeNull();
  });
});

describe("changedTempoFields", () => {
  const stored = { cleanBpm: 80, maxBpm: 96, durationMinutes: 10, notes: null };

  it("returns only what changed", () => {
    expect(changedTempoFields(stored, { ...stored, maxBpm: 100 })).toEqual({
      maxBpm: 100,
    });
    expect(changedTempoFields(stored, { ...stored, notes: "Slow" })).toEqual({
      notes: "Slow",
    });
  });

  it("returns an empty object when nothing changed", () => {
    expect(changedTempoFields(stored, { ...stored })).toEqual({});
  });
});
