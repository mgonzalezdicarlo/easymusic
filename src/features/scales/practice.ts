import type { FieldErrors } from "@/features/auth/schemas";
import {
  parseTempoDraft,
  type TempoEntryDraft,
  type TempoEntryPayload,
  toEntryPayload,
} from "@/features/practice/tempo-entry";
import {
  pitchClass,
  SCALE_MODES,
  type ScaleModeValue,
  scaleName,
} from "@/features/scales/catalog";
import {
  describeSetup,
  type HandsModeValue,
} from "@/features/scales/configuration";

// Pure rules for logging scale practice (E4-03). No React or server imports.

/** An active tracked setup that can be logged, with its latest entry for prefilling. */
export type LoggableScale = {
  id: string;
  tonic: string;
  mode: ScaleModeValue;
  octaves: number;
  handsMode: HandsModeValue;
  targetBpm: number;
  last: { cleanBpm: number; maxBpm: number; durationMinutes: number } | null;
};

export type LogScaleEntryBody = TempoEntryPayload & { userScaleId: string };

/** One scale in the multi-scale form. `key` identifies the row in the UI. */
export type EntryRow = TempoEntryDraft & { key: string; userScaleId: string };

/** A logged entry shown in the "Recent scale practice" list. `date` is YYYY-MM-DD. */
export type RecentScaleEntry = TempoEntryPayload & {
  id: string;
  sessionId: string;
  date: string;
  tonic: string;
  mode: ScaleModeValue;
  octaves: number;
  handsMode: HandsModeValue;
};

const MODE_ORDER = new Map<string, number>(
  SCALE_MODES.map(({ value }, index) => [value, index]),
);

/** "C major · 2 octaves, hands together". */
export function entryLabel(
  scale: Pick<LoggableScale, "tonic" | "mode" | "octaves" | "handsMode">,
): string {
  return `${scaleName(scale)} · ${describeSetup(scale)}`;
}

/** By key from C, then mode, octaves and hands. */
export function sortLoggable(
  scales: readonly LoggableScale[],
): LoggableScale[] {
  return [...scales].sort(
    (a, b) =>
      pitchClass(a.tonic) - pitchClass(b.tonic) ||
      (MODE_ORDER.get(a.mode) ?? 0) - (MODE_ORDER.get(b.mode) ?? 0) ||
      a.octaves - b.octaves ||
      a.handsMode.localeCompare(b.handsMode),
  );
}

/** A new row, prefilled from the last entry of the setup. Notes always start empty. */
export function newRow(scale: LoggableScale, key: string): EntryRow {
  const { last } = scale;

  return {
    key,
    userScaleId: scale.id,
    cleanBpm: last ? String(last.cleanBpm) : "",
    maxBpm: last ? String(last.maxBpm) : "",
    duration:
      last && last.durationMinutes >= 1 ? String(last.durationMinutes) : "",
    notes: "",
  };
}

export type ParsedRows =
  | { ok: true; entries: LogScaleEntryBody[] }
  | { ok: false; errors: Record<string, FieldErrors> };

/** Validates every row. Errors are keyed by row key. */
export function parseEntryRows(rows: readonly EntryRow[]): ParsedRows {
  const errors: Record<string, FieldErrors> = {};
  const entries: LogScaleEntryBody[] = [];

  for (const row of rows) {
    const result = parseTempoDraft(row);

    if (result.success) {
      entries.push({
        userScaleId: row.userScaleId,
        ...toEntryPayload(result.data),
      });
    } else {
      errors[row.key] = result.errors;
    }
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, entries };
}

/**
 * Maps a failed request to the rows. The API reports `entries.<index>.<field>`, and the
 * index is the position of the row that was sent. Everything else is a form-level message.
 */
export function mapFailure(
  failure: { formError: string | null; fieldErrors: Record<string, string> },
  rows: readonly EntryRow[],
): { rowErrors: Record<string, FieldErrors>; formError: string | null } {
  const rowErrors: Record<string, FieldErrors> = {};
  const general: string[] = failure.formError ? [failure.formError] : [];

  for (const [path, message] of Object.entries(failure.fieldErrors)) {
    const match = /^entries\.(\d+)\.(\w+)$/.exec(path);
    const row = match ? rows[Number(match[1])] : undefined;

    if (match && row) {
      rowErrors[row.key] = { ...rowErrors[row.key], [match[2]]: message };
    } else {
      general.push(message);
    }
  }

  return {
    rowErrors,
    formError: general.length > 0 ? general.join(" ") : null,
  };
}
