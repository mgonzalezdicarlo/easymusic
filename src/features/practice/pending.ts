import type { SessionSummary } from "@/features/practice/model";

/** Ids of sessions that exist only in the browser, until the server has saved them. */
export const PENDING_ID_PREFIX = "pending-";

/** A change shown before the server confirms it. `session` is the new state, or the deleted one. */
export type PendingChange = {
  key: string;
  kind: "create" | "update" | "delete";
  session: SessionSummary;
  /** The API accepted the change. It stays visible until the refreshed data arrives. */
  settled: boolean;
};

export type SessionRow = { session: SessionSummary; busy: boolean };

/**
 * Overlays pending changes on the server's list, newest date first. Rows with a change in
 * flight are `busy`, so the UI does not allow a second action on them.
 */
export function applyPending(
  sessions: readonly SessionSummary[],
  changes: readonly PendingChange[],
  limit: number,
): SessionRow[] {
  const busy = new Set<string>();
  let rows = [...sessions];

  for (const { kind, session } of changes) {
    busy.add(session.id);

    if (kind === "create") {
      rows = [session, ...rows];
    } else if (kind === "update") {
      rows = rows.map((row) => (row.id === session.id ? session : row));
    } else {
      rows = rows.filter((row) => row.id !== session.id);
    }
  }

  // ISO dates sort as text. The sort is stable, so new sessions stay first within a day.
  rows.sort((a, b) => b.date.localeCompare(a.date));

  return rows
    .slice(0, limit)
    .map((session) => ({ session, busy: busy.has(session.id) }));
}
