import { z } from "zod";

import { paginationQuerySchema } from "@/server/api/pagination";
import { MAX_NOTES_LENGTH } from "@/server/sessions/schemas";
import {
  atLeastOneField,
  hasAnyField,
  idSchema,
  targetBpmSchema,
  trackingStatusSchema,
} from "@/server/tracking/shared";

export const MAX_TITLE_LENGTH = 200;
export const MAX_EXERCISE_NUMBER = 9999;
const MAX_SEARCH_LENGTH = 100;

export const exerciseSourceSchema = z.enum(["HANON", "CZERNY", "CUSTOM"]);
// Users can only create these. HANON rows are the shared catalog.
const customSourceSchema = z.enum(["CZERNY", "CUSTOM"]);

const titleSchema = z.string().trim().min(1).max(MAX_TITLE_LENGTH);
const numberSchema = z.number().int().min(1).max(MAX_EXERCISE_NUMBER);
// Blank descriptions are stored as null. null clears an existing description.
const descriptionSchema = z
  .string()
  .trim()
  .max(MAX_NOTES_LENGTH)
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const listExercisesQuerySchema = paginationQuerySchema.extend({
  source: exerciseSourceSchema.optional(),
  // Blank means no search.
  search: z
    .string()
    .trim()
    .max(MAX_SEARCH_LENGTH)
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
});

export const listUserExercisesQuerySchema = paginationQuerySchema.extend({
  status: trackingStatusSchema.optional(),
});

export const exerciseParamsSchema = z.object({ exerciseId: idSchema });
export const userExerciseParamsSchema = z.object({ userExerciseId: idSchema });

export const createExerciseSchema = z.strictObject({
  source: customSourceSchema,
  title: titleSchema,
  number: numberSchema.optional(),
  description: descriptionSchema.optional(),
  targetBpm: targetBpmSchema.optional(),
});

export const updateExerciseSchema = z
  .strictObject({
    source: customSourceSchema.optional(),
    title: titleSchema.optional(),
    number: numberSchema.nullable().optional(),
    description: descriptionSchema.optional(),
    targetBpm: targetBpmSchema.nullable().optional(),
  })
  .refine(hasAnyField, atLeastOneField);

export const createUserExerciseSchema = z.strictObject({
  exerciseId: idSchema,
  targetBpm: targetBpmSchema,
});

export const updateUserExerciseSchema = z
  .strictObject({
    targetBpm: targetBpmSchema.optional(),
    status: trackingStatusSchema.optional(),
  })
  .refine(hasAnyField, atLeastOneField);

export type ListExercisesQuery = z.output<typeof listExercisesQuerySchema>;
export type ListUserExercisesQuery = z.output<
  typeof listUserExercisesQuerySchema
>;
export type CreateExerciseInput = z.output<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.output<typeof updateExerciseSchema>;
export type CreateUserExerciseInput = z.output<typeof createUserExerciseSchema>;
export type UpdateUserExerciseInput = z.output<typeof updateUserExerciseSchema>;
