import { send } from "@/features/settings/api";

export type CreateSessionBody = {
  date: string;
  durationMinutes: number;
  notes: string | null;
};
export type UpdateSessionBody = Partial<CreateSessionBody>;

const jsonHeaders = { "Content-Type": "application/json" };

export function createSessionRequest(body: CreateSessionBody) {
  return send("/api/sessions", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
}

export function updateSessionRequest(id: string, body: UpdateSessionBody) {
  return send(`/api/sessions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
}

export function deleteSessionRequest(id: string) {
  return send(`/api/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
}
