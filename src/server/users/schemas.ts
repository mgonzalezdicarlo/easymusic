import { z } from "zod";

import {
  dailyGoalSchema,
  nameSchema,
  timezoneSchema,
} from "@/lib/user-preferences";
import { atLeastOneField, hasAnyField } from "@/server/tracking/shared";

export const updateProfileSchema = z
  .strictObject({
    name: nameSchema.optional(),
    timezone: timezoneSchema.optional(),
    dailyGoalMinutes: dailyGoalSchema.optional(),
    // Sent by the first-run prompt to record that setup is finished.
    completeOnboarding: z.literal(true).optional(),
  })
  .refine(hasAnyField, atLeastOneField);

/** DELETE query. Deleting the account always needs an explicit `?confirm=true`. */
export const deleteAccountQuerySchema = z.object({
  confirm: z.literal(
    "true",
    "Repeat the request with ?confirm=true to delete the account and all of its data.",
  ),
});

export type UpdateProfileInput = z.output<typeof updateProfileSchema>;
