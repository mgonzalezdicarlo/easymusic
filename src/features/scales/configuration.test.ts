// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  changedFields,
  describeSetup,
  duplicateMessage,
  findDuplicate,
  type ScaleSetup,
  setupFormSchema,
} from "@/features/scales/configuration";

const together2: ScaleSetup = {
  id: "s1",
  octaves: 2,
  handsMode: "TOGETHER",
  targetBpm: 100,
  status: "ACTIVE",
};

function messages(input: unknown) {
  const result = setupFormSchema.safeParse(input);

  return result.success ? [] : result.error.issues.map((i) => i.message);
}

const valid = { octaves: 2, handsMode: "TOGETHER", targetBpm: 100 };

describe("setupFormSchema", () => {
  it("accepts the limits of the ranges", () => {
    expect(
      setupFormSchema.safeParse({ ...valid, octaves: 1, targetBpm: 20 })
        .success,
    ).toBe(true);
    expect(
      setupFormSchema.safeParse({
        octaves: 4,
        handsMode: "SEPARATE",
        targetBpm: 300,
      }).success,
    ).toBe(true);
  });

  it.each([
    [{ octaves: 0 }, "Use at least 1 octave."],
    [{ octaves: 5 }, "Use at most 4 octaves."],
    [{ octaves: 2.5 }, "Choose a whole number of octaves."],
    [{ octaves: Number.NaN }, "Choose how many octaves (1 to 4)."],
    [{ handsMode: "LEFT" }, "Choose hands together or hands separate."],
    [{ targetBpm: 19 }, "Use at least 20 BPM."],
    [{ targetBpm: 301 }, "Use at most 300 BPM."],
    [{ targetBpm: 90.5 }, "Enter a whole number of BPM."],
    [{ targetBpm: Number.NaN }, "Enter a whole number of BPM."],
  ])("rejects %j with a clear message", (extra, message) => {
    expect(messages({ ...valid, ...extra })).toContain(message);
  });
});

describe("describeSetup", () => {
  it("writes octaves and hands", () => {
    expect(describeSetup(together2)).toBe("2 octaves, hands together");
    expect(describeSetup({ octaves: 1, handsMode: "SEPARATE" })).toBe(
      "1 octave, hands separate",
    );
  });
});

describe("findDuplicate", () => {
  it("finds the same octaves and hands, whatever the target", () => {
    expect(
      findDuplicate([together2], { octaves: 2, handsMode: "TOGETHER" }),
    ).toBe(together2);
  });

  it("lets the same scale be tracked in other configurations", () => {
    expect(
      findDuplicate([together2], { octaves: 4, handsMode: "SEPARATE" }),
    ).toBeUndefined();
    expect(
      findDuplicate([together2], { octaves: 2, handsMode: "SEPARATE" }),
    ).toBeUndefined();
    expect(
      findDuplicate([together2], { octaves: 4, handsMode: "TOGETHER" }),
    ).toBeUndefined();
  });

  it("ignores the setup being edited", () => {
    expect(
      findDuplicate([together2], { octaves: 2, handsMode: "TOGETHER" }, "s1"),
    ).toBeUndefined();
  });

  it("counts archived setups, which still own their configuration", () => {
    const archived = { ...together2, status: "ARCHIVED" as const };

    expect(
      findDuplicate([archived], { octaves: 2, handsMode: "TOGETHER" }),
    ).toBe(archived);
  });
});

describe("duplicateMessage", () => {
  it("names the existing setup and suggests what to do", () => {
    expect(duplicateMessage("C major", together2)).toBe(
      "You already track C major with 2 octaves, hands together. Change the octaves or the hands, or edit the existing setup.",
    );
  });

  it("tells the user to restore an archived setup", () => {
    expect(
      duplicateMessage("C major", { ...together2, status: "ARCHIVED" }),
    ).toBe(
      "You already track C major with 2 octaves, hands together, but it is archived. Restore it instead of adding it again.",
    );
  });
});

describe("changedFields", () => {
  it("returns only what changed", () => {
    expect(
      changedFields(together2, {
        octaves: 2,
        handsMode: "TOGETHER",
        targetBpm: 120,
      }),
    ).toEqual({ targetBpm: 120 });
    expect(
      changedFields(together2, {
        octaves: 4,
        handsMode: "SEPARATE",
        targetBpm: 100,
      }),
    ).toEqual({ octaves: 4, handsMode: "SEPARATE" });
  });

  it("returns an empty object when nothing changed", () => {
    expect(changedFields(together2, { ...together2 })).toEqual({});
  });
});
