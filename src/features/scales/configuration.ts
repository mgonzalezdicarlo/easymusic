import { z } from "zod";

// Client-side mirror of the tracked scale rules enforced by src/server/scales and the
// migrations (octaves 1-4, target BPM 20-300). The API stays the authority and validates
// every request again. Pure module: no React or server imports (E4-02).
export const MIN_OCTAVES = 1;
export const MAX_OCTAVES = 4;
export const MIN_TARGET_BPM = 20;
export const MAX_TARGET_BPM = 300;

export const HANDS_MODES = [
  { value: "TOGETHER", label: "Hands together" },
  { value: "SEPARATE", label: "Hands separate" },
] as const;

export type HandsModeValue = (typeof HANDS_MODES)[number]["value"];
export type TrackingStatusValue = "ACTIVE" | "ARCHIVED";

/** One tracked configuration of a scale (octaves x hands mode). */
export type ScaleSetup = {
  id: string;
  octaves: number;
  handsMode: HandsModeValue;
  targetBpm: number;
  status: TrackingStatusValue;
};

export const setupFormSchema = z.object({
  octaves: z
    .number({ error: "Choose how many octaves (1 to 4)." })
    .int("Choose a whole number of octaves.")
    .min(MIN_OCTAVES, `Use at least ${MIN_OCTAVES} octave.`)
    .max(MAX_OCTAVES, `Use at most ${MAX_OCTAVES} octaves.`),
  handsMode: z.enum(["TOGETHER", "SEPARATE"], {
    error: "Choose hands together or hands separate.",
  }),
  targetBpm: z
    .number({ error: "Enter a whole number of BPM." })
    .int("Enter a whole number of BPM.")
    .min(MIN_TARGET_BPM, `Use at least ${MIN_TARGET_BPM} BPM.`)
    .max(MAX_TARGET_BPM, `Use at most ${MAX_TARGET_BPM} BPM.`),
});

export type SetupFormValues = z.output<typeof setupFormSchema>;

/** Starting point offered when tracking a new setup. */
export const DEFAULT_SETUP: SetupFormValues = {
  octaves: 2,
  handsMode: "TOGETHER",
  targetBpm: 100,
};

export const isActiveSetup = (setup: Pick<ScaleSetup, "status">) =>
  setup.status === "ACTIVE";

/** "2 octaves, hands together". */
export function describeSetup({
  octaves,
  handsMode,
}: Pick<SetupFormValues, "octaves" | "handsMode">): string {
  const unit = octaves === 1 ? "octave" : "octaves";
  const hands = handsMode === "TOGETHER" ? "together" : "separate";

  return `${octaves} ${unit}, hands ${hands}`;
}

/**
 * The setup that already uses this octaves x hands combination, if any. `ignoreId` skips the
 * setup being edited. Archived setups count: they still own their combination.
 */
export function findDuplicate(
  setups: readonly ScaleSetup[],
  candidate: Pick<SetupFormValues, "octaves" | "handsMode">,
  ignoreId?: string,
): ScaleSetup | undefined {
  return setups.find(
    (setup) =>
      setup.id !== ignoreId &&
      setup.octaves === candidate.octaves &&
      setup.handsMode === candidate.handsMode,
  );
}

export function duplicateMessage(
  scaleLabel: string,
  existing: Pick<ScaleSetup, "octaves" | "handsMode" | "status">,
): string {
  const base = `You already track ${scaleLabel} with ${describeSetup(existing)}`;

  return existing.status === "ARCHIVED"
    ? `${base}, but it is archived. Restore it instead of adding it again.`
    : `${base}. Change the octaves or the hands, or edit the existing setup.`;
}

/** Only the fields that differ from the stored setup, for a PATCH request. */
export function changedFields(
  setup: ScaleSetup,
  values: SetupFormValues,
): Partial<SetupFormValues> {
  const patch: Partial<SetupFormValues> = {};

  if (values.octaves !== setup.octaves) patch.octaves = values.octaves;
  if (values.handsMode !== setup.handsMode) patch.handsMode = values.handsMode;
  if (values.targetBpm !== setup.targetBpm) patch.targetBpm = values.targetBpm;

  return patch;
}
