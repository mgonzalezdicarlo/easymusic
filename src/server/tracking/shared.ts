import { z } from "zod";

import { ApiError } from "@/server/api/errors";
import { MAX_BPM, MIN_BPM } from "@/server/sessions/schemas";

export const UNIQUE_VIOLATION = "P2002";
export const RECORD_NOT_FOUND = "P2025";

export const idSchema = z.string().min(1);
export const targetBpmSchema = z.number().int().min(MIN_BPM).max(MAX_BPM);
export const trackingStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);

/** DELETE query. `?confirm=true` allows deleting an item together with its practice history. */
export const deleteQuerySchema = z.object({
  confirm: z.literal("true").optional(),
});

export const hasAnyField = (value: object) =>
  Object.values(value).some((field) => field !== undefined);
export const atLeastOneField = {
  message: "Provide at least one field to update.",
};

/** The Prisma error code (for example "P2002"), without depending on the error class. */
export function prismaErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
}

/** Deleting an item that has practice history needs an explicit confirmation. */
export function assertDeleteConfirmed(
  confirmed: boolean,
  historyCount: number,
  subject: string,
) {
  if (confirmed || historyCount === 0) return;

  const entries =
    historyCount === 1
      ? "1 practice entry"
      : `${historyCount} practice entries`;

  throw ApiError.conflict(
    `${subject} has ${entries}. Archive it instead (set status to ARCHIVED), or repeat the request with ?confirm=true to delete it together with its history.`,
  );
}
