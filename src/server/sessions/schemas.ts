import { z } from "zod";

import { paginationQuerySchema } from "@/server/api/pagination";
import { isSupportedDate, MIN_SESSION_DATE } from "@/server/sessions/dates";

// Same ranges as the CHECK constraints in the migrations.
export const MAX_MINUTES = 1440;
export const MIN_BPM = 20;
export const MAX_BPM = 300;
export const MAX_NOTES_LENGTH = 2000;
export const TEMPO_ORDER_MESSAGE =
  "Max BPM must be greater than or equal to clean BPM.";

const idSchema = z.string().min(1);
const dateSchema = z
  .string()
  .refine(
    isSupportedDate,
    `Use a real date as YYYY-MM-DD, on or after ${MIN_SESSION_DATE}.`,
  );
const minutesSchema = z.number().int().min(0).max(MAX_MINUTES);
const bpmSchema = z.number().int().min(MIN_BPM).max(MAX_BPM);
// Blank notes are stored as null. null clears existing notes on update.
const notesSchema = z
  .string()
  .trim()
  .max(MAX_NOTES_LENGTH)
  .transform((value) => (value === "" ? null : value))
  .nullable();

const hasAnyField = (value: object) =>
  Object.values(value).some((field) => field !== undefined);
const atLeastOneField = { message: "Provide at least one field to update." };
const tempoOrder = (value: { cleanBpm: number; maxBpm: number }) =>
  value.maxBpm >= value.cleanBpm;
const tempoOrderIssue = { path: ["maxBpm"], message: TEMPO_ORDER_MESSAGE };

export const sessionParamsSchema = z.object({ sessionId: idSchema });
export const entryParamsSchema = sessionParamsSchema.extend({
  entryId: idSchema,
});

export const listSessionsQuerySchema = paginationQuerySchema
  .extend({ from: dateSchema.optional(), to: dateSchema.optional() })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    path: ["to"],
    message: "`to` must not be earlier than `from`.",
  });

export const createSessionSchema = z.strictObject({
  date: dateSchema,
  durationMinutes: minutesSchema.default(0),
  notes: notesSchema.optional(),
});

export const updateSessionSchema = z
  .strictObject({
    date: dateSchema.optional(),
    durationMinutes: minutesSchema.optional(),
    notes: notesSchema.optional(),
  })
  .refine(hasAnyField, atLeastOneField);

const entryFields = {
  cleanBpm: bpmSchema,
  maxBpm: bpmSchema,
  durationMinutes: minutesSchema,
  notes: notesSchema.optional(),
};

export const createScaleEntrySchema = z
  .strictObject({ userScaleId: idSchema, ...entryFields })
  .refine(tempoOrder, tempoOrderIssue);

export const createExerciseEntrySchema = z
  .strictObject({ userExerciseId: idSchema, ...entryFields })
  .refine(tempoOrder, tempoOrderIssue);

/** Shared by scale and exercise entries. The tracked item of an entry cannot change. */
export const updateEntrySchema = z
  .strictObject({
    cleanBpm: bpmSchema.optional(),
    maxBpm: bpmSchema.optional(),
    durationMinutes: minutesSchema.optional(),
    notes: notesSchema.optional(),
  })
  .refine(hasAnyField, atLeastOneField);

export type ListSessionsQuery = z.output<typeof listSessionsQuerySchema>;
export type CreateSessionInput = z.output<typeof createSessionSchema>;
export type UpdateSessionInput = z.output<typeof updateSessionSchema>;
export type CreateScaleEntryInput = z.output<typeof createScaleEntrySchema>;
export type CreateExerciseEntryInput = z.output<
  typeof createExerciseEntrySchema
>;
export type UpdateEntryInput = z.output<typeof updateEntrySchema>;
