import { z } from "zod";

import { type FieldErrors, firstFieldErrors } from "@/features/auth/schemas";
import {
  MAX_SESSION_MINUTES,
  MAX_SESSION_NOTES_LENGTH,
} from "@/lib/practice-session";
import { parseGoalInput } from "@/lib/user-preferences";

// Client-side mirror of the clean/max tempo rules enforced by src/server/sessions/schemas.ts.
// Shared by scale entries (E4-03) and, later, exercise entries (E5-03). The API stays the
// authority and validates every request again. Pure module: no React or server imports.
export const MIN_BPM = 20;
export const MAX_BPM = 300;
export const TEMPO_ORDER_MESSAGE =
  "Max BPM must be greater than or equal to clean BPM.";

function bpmSchema(name: string) {
  const invalid = `Enter ${name} as a whole number of BPM.`;

  return z
    .number({ error: invalid })
    .int(invalid)
    .min(MIN_BPM, `Use at least ${MIN_BPM} BPM.`)
    .max(MAX_BPM, `Use at most ${MAX_BPM} BPM.`);
}

const minutesMessage = "Enter a whole number of minutes.";

export const tempoEntrySchema = z
  .object({
    cleanBpm: bpmSchema("the clean tempo"),
    maxBpm: bpmSchema("the max tempo"),
    durationMinutes: z
      .number({ error: minutesMessage })
      .int(minutesMessage)
      .min(1, "Enter at least 1 minute.")
      .max(
        MAX_SESSION_MINUTES,
        `Use at most ${MAX_SESSION_MINUTES} minutes (one day).`,
      ),
    notes: z
      .string()
      .trim()
      .max(
        MAX_SESSION_NOTES_LENGTH,
        `Use at most ${MAX_SESSION_NOTES_LENGTH} characters.`,
      ),
  })
  .refine((value) => value.maxBpm >= value.cleanBpm, {
    path: ["maxBpm"],
    message: TEMPO_ORDER_MESSAGE,
  });

export type TempoEntryValues = z.output<typeof tempoEntrySchema>;

/** Raw form text, so a failed save keeps what the user typed. */
export type TempoEntryDraft = {
  cleanBpm: string;
  maxBpm: string;
  duration: string;
  notes: string;
};

/** The fields the API accepts. Blank notes are `null`. */
export type TempoEntryPayload = {
  cleanBpm: number;
  maxBpm: number;
  durationMinutes: number;
  notes: string | null;
};

export function parseTempoDraft(
  draft: TempoEntryDraft,
):
  | { success: true; data: TempoEntryValues }
  | { success: false; errors: FieldErrors } {
  const result = tempoEntrySchema.safeParse({
    cleanBpm: parseGoalInput(draft.cleanBpm),
    maxBpm: parseGoalInput(draft.maxBpm),
    durationMinutes: parseGoalInput(draft.duration),
    notes: draft.notes,
  });

  return result.success
    ? { success: true, data: result.data }
    : { success: false, errors: firstFieldErrors(result.error) };
}

export function toEntryPayload(values: TempoEntryValues): TempoEntryPayload {
  return {
    cleanBpm: values.cleanBpm,
    maxBpm: values.maxBpm,
    durationMinutes: values.durationMinutes,
    notes: values.notes === "" ? null : values.notes,
  };
}

/** Only the fields that differ from the stored entry, for a PATCH request. */
export function changedTempoFields(
  stored: TempoEntryPayload,
  next: TempoEntryPayload,
): Partial<TempoEntryPayload> {
  const patch: Partial<TempoEntryPayload> = {};

  if (next.cleanBpm !== stored.cleanBpm) patch.cleanBpm = next.cleanBpm;
  if (next.maxBpm !== stored.maxBpm) patch.maxBpm = next.maxBpm;
  if (next.durationMinutes !== stored.durationMinutes) {
    patch.durationMinutes = next.durationMinutes;
  }
  if (next.notes !== stored.notes) patch.notes = next.notes;

  return patch;
}
