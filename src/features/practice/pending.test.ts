// @vitest-environment node
import { describe, expect, it } from "vitest";

import type { SessionSummary } from "@/features/practice/model";
import { applyPending, type PendingChange } from "@/features/practice/pending";

function session(
  id: string,
  date: string,
  extra: Partial<SessionSummary> = {},
) {
  return {
    id,
    date,
    durationMinutes: 30,
    notes: null,
    entryCount: 0,
    ...extra,
  };
}

function change(
  kind: PendingChange["kind"],
  value: SessionSummary,
): PendingChange {
  return { key: `k-${value.id}`, kind, session: value, settled: false };
}

const server = [session("a", "2026-01-20"), session("b", "2026-01-15")];

describe("applyPending", () => {
  it("returns the server rows when nothing is pending", () => {
    const rows = applyPending(server, [], 10);

    expect(rows.map((row) => row.session.id)).toEqual(["a", "b"]);
    expect(rows.every((row) => !row.busy)).toBe(true);
  });

  it("puts a created session first within its day and keeps newest dates first", () => {
    const rows = applyPending(
      server,
      [
        change("create", session("pending-1", "2026-01-20")),
        change("create", session("pending-2", "2026-01-25")),
      ],
      10,
    );

    expect(rows.map((row) => row.session.id)).toEqual([
      "pending-2",
      "pending-1",
      "a",
      "b",
    ]);
    expect(rows[0].busy).toBe(true);
  });

  it("applies updates and deletes and marks the rows busy", () => {
    const rows = applyPending(
      server,
      [
        change("update", session("a", "2026-01-20", { durationMinutes: 50 })),
        change("delete", server[1]),
      ],
      10,
    );

    expect(rows).toEqual([
      {
        session: expect.objectContaining({ id: "a", durationMinutes: 50 }),
        busy: true,
      },
    ]);
  });

  it("shows at most `limit` rows", () => {
    const rows = applyPending(
      server,
      [change("create", session("p", "2026-02-01"))],
      2,
    );

    expect(rows.map((row) => row.session.id)).toEqual(["p", "a"]);
  });
});
