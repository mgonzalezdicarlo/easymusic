import { send } from "@/features/settings/api";

export type TrackScaleBody = {
  scaleId: string;
  octaves: number;
  handsMode: "SEPARATE" | "TOGETHER";
  targetBpm: number;
};

export function trackScaleRequest(body: TrackScaleBody) {
  return send("/api/user-scales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type UpdateScaleBody = Partial<Omit<TrackScaleBody, "scaleId">> & {
  status?: "ACTIVE" | "ARCHIVED";
};

export function updateUserScaleRequest(id: string, body: UpdateScaleBody) {
  return send(`/api/user-scales/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
