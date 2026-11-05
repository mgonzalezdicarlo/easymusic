import { z } from "zod";

import { createScaleEntrySchema } from "@/server/sessions/schemas";

/** Most scales that can be logged in one request. */
export const MAX_LOGGED_SCALES = 20;

// The rules of a single scale entry (BPM 20-300, maxBpm >= cleanBpm, notes), plus at least
// 1 minute: a session whose entries add up to 0 minutes is not practice for the heat map
// or the streaks.
const loggedEntrySchema = createScaleEntrySchema.refine(
  (entry) => entry.durationMinutes >= 1,
  { path: ["durationMinutes"], message: "Enter at least 1 minute." },
);

export const logScalePracticeSchema = z.strictObject({
  entries: z
    .array(loggedEntrySchema)
    .min(1, "Add at least one scale.")
    .max(MAX_LOGGED_SCALES, `Log at most ${MAX_LOGGED_SCALES} scales at once.`),
});

export type LogScalePracticeInput = z.output<typeof logScalePracticeSchema>;
