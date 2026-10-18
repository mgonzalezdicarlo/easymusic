import { describe, expect, it } from "vitest";

import {
  ownedExercisesWhere,
  visibleExercisesWhere,
} from "@/server/exercises/access";

describe("visibleExercisesWhere", () => {
  it("matches the shared catalog and the user's own exercises only", () => {
    expect(visibleExercisesWhere("user-1")).toEqual({
      OR: [{ ownerId: null }, { ownerId: "user-1" }],
    });
  });
});

describe("ownedExercisesWhere", () => {
  it("only matches exercises owned by the user, never catalog rows", () => {
    expect(ownedExercisesWhere("user-1")).toEqual({ ownerId: "user-1" });
  });
});
