import type { TempoEntryPayload } from "@/features/practice/tempo-entry";
import type { LogScaleEntryBody } from "@/features/scales/practice";
import { send } from "@/features/settings/api";

const jsonHeaders = { "Content-Type": "application/json" };

/** Logs one or more scales in today's session, in one request. */
export function logScalePracticeRequest(entries: readonly LogScaleEntryBody[]) {
  return send("/api/scale-practice", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ entries }),
  });
}

export function updateScaleEntryRequest(
  sessionId: string,
  entryId: string,
  body: Partial<TempoEntryPayload>,
) {
  return send(
    `/api/sessions/${encodeURIComponent(sessionId)}/scale-entries/${encodeURIComponent(entryId)}`,
    { method: "PATCH", headers: jsonHeaders, body: JSON.stringify(body) },
  );
}

export function deleteScaleEntryRequest(sessionId: string, entryId: string) {
  return send(
    `/api/sessions/${encodeURIComponent(sessionId)}/scale-entries/${encodeURIComponent(entryId)}`,
    { method: "DELETE" },
  );
}
