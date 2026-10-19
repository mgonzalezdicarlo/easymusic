import { z } from "zod";

import { paginationQuerySchema } from "@/server/api/pagination";
import {
  atLeastOneField,
  hasAnyField,
  idSchema,
  targetBpmSchema,
  trackingStatusSchema,
} from "@/server/tracking/shared";

export const scaleModeSchema = z.enum([
  "MAJOR",
  "NATURAL_MINOR",
  "HARMONIC_MINOR",
  "MELODIC_MINOR",
  "DORIAN",
  "PHRYGIAN",
  "LYDIAN",
  "MIXOLYDIAN",
  "LOCRIAN",
]);
export const handsModeSchema = z.enum(["SEPARATE", "TOGETHER"]);
const octavesSchema = z.number().int().min(1).max(4);

export const listScalesQuerySchema = paginationQuerySchema.extend({
  tonic: z
    .string()
    .regex(/^[A-G][#b]?$/, "Use a tonic such as C, F# or Bb.")
    .optional(),
  mode: scaleModeSchema.optional(),
});

export const listUserScalesQuerySchema = paginationQuerySchema.extend({
  status: trackingStatusSchema.optional(),
});

export const userScaleParamsSchema = z.object({ userScaleId: idSchema });

export const createUserScaleSchema = z.strictObject({
  scaleId: idSchema,
  octaves: octavesSchema,
  handsMode: handsModeSchema,
  targetBpm: targetBpmSchema,
});

export const updateUserScaleSchema = z
  .strictObject({
    octaves: octavesSchema.optional(),
    handsMode: handsModeSchema.optional(),
    targetBpm: targetBpmSchema.optional(),
    status: trackingStatusSchema.optional(),
  })
  .refine(hasAnyField, atLeastOneField);

export type ListScalesQuery = z.output<typeof listScalesQuerySchema>;
export type ListUserScalesQuery = z.output<typeof listUserScalesQuerySchema>;
export type CreateUserScaleInput = z.output<typeof createUserScaleSchema>;
export type UpdateUserScaleInput = z.output<typeof updateUserScaleSchema>;
