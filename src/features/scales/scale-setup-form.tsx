"use client";

import { type FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type FieldErrors, firstFieldErrors } from "@/features/auth/schemas";
import {
  duplicateMessage,
  findDuplicate,
  HANDS_MODES,
  type HandsModeValue,
  MAX_OCTAVES,
  MAX_TARGET_BPM,
  MIN_OCTAVES,
  MIN_TARGET_BPM,
  type ScaleSetup,
  setupFormSchema,
  type SetupFormValues,
} from "@/features/scales/configuration";
import { parseGoalInput } from "@/lib/user-preferences";
import { cn } from "@/lib/utils";

/** Errors from a failed save, shown inside the form. */
export type SetupFailure = {
  formError: string | null;
  fieldErrors: FieldErrors;
};

const SELECT_CLASS =
  "border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>option]:bg-popover [&>option]:text-popover-foreground h-8 w-full rounded-lg border bg-transparent px-2 py-1 text-base transition-colors outline-none focus-visible:ring-3 disabled:opacity-50 aria-invalid:ring-3 md:text-sm";

const OCTAVE_OPTIONS = Array.from(
  { length: MAX_OCTAVES - MIN_OCTAVES + 1 },
  (_, index) => MIN_OCTAVES + index,
);

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

function Field({ id, label, error, hint, children }: FieldProps) {
  const message = error ?? hint;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {message ? (
        <p
          id={`${id}-message`}
          className={cn(
            "text-sm",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

type ScaleSetupFormProps = {
  /** "C major". Used in the duplicate message. */
  scaleName: string;
  initial: SetupFormValues;
  /** Every setup (active and archived) of this scale, for the duplicate check. */
  setups: readonly ScaleSetup[];
  /** The setup being edited. It does not count as a duplicate of itself. */
  editingId?: string;
  submitLabel: string;
  pending?: boolean;
  failure?: SetupFailure;
  onSubmit: (values: SetupFormValues) => void;
  onCancel: () => void;
};

export function ScaleSetupForm({
  scaleName,
  initial,
  setups,
  editingId,
  submitLabel,
  pending = false,
  failure,
  onSubmit,
  onCancel,
}: ScaleSetupFormProps) {
  const id = useId();
  const [octaves, setOctaves] = useState(String(initial.octaves));
  const [handsMode, setHandsMode] = useState<HandsModeValue>(initial.handsMode);
  const [targetBpm, setTargetBpm] = useState(String(initial.targetBpm));
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [duplicate, setDuplicate] = useState<string | null>(null);

  const octavesId = `${id}-octaves`;
  const handsId = `${id}-hands`;
  const bpmId = `${id}-bpm`;

  const hasClientErrors = Object.keys(clientErrors).length > 0;
  const errors: FieldErrors = hasClientErrors
    ? clientErrors
    : (failure?.fieldErrors ?? {});
  const formError =
    duplicate ?? (hasClientErrors ? null : (failure?.formError ?? null));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDuplicate(null);

    const parsed = setupFormSchema.safeParse({
      octaves: Number(octaves),
      handsMode,
      targetBpm: parseGoalInput(targetBpm),
    });

    if (!parsed.success) {
      setClientErrors(firstFieldErrors(parsed.error));
      return;
    }

    setClientErrors({});

    const existing = findDuplicate(setups, parsed.data, editingId);

    if (existing) {
      setDuplicate(duplicateMessage(scaleName, existing));
      return;
    }

    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <Field id={octavesId} label="Octaves" error={errors.octaves}>
        <select
          id={octavesId}
          name="octaves"
          value={octaves}
          disabled={pending}
          onChange={(event) => {
            setOctaves(event.target.value);
            setDuplicate(null);
          }}
          aria-invalid={errors.octaves ? true : undefined}
          aria-describedby={errors.octaves ? `${octavesId}-message` : undefined}
          className={SELECT_CLASS}
        >
          {OCTAVE_OPTIONS.map((count) => (
            <option key={count} value={count}>
              {`${count} ${count === 1 ? "octave" : "octaves"}`}
            </option>
          ))}
        </select>
      </Field>
      <Field id={handsId} label="Hands" error={errors.handsMode}>
        <select
          id={handsId}
          name="handsMode"
          value={handsMode}
          disabled={pending}
          onChange={(event) => {
            setHandsMode(event.target.value as HandsModeValue);
            setDuplicate(null);
          }}
          aria-invalid={errors.handsMode ? true : undefined}
          aria-describedby={errors.handsMode ? `${handsId}-message` : undefined}
          className={SELECT_CLASS}
        >
          {HANDS_MODES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field
        id={bpmId}
        label="Target tempo (BPM)"
        error={errors.targetBpm}
        hint={`Between ${MIN_TARGET_BPM} and ${MAX_TARGET_BPM} beats per minute.`}
      >
        <Input
          id={bpmId}
          name="targetBpm"
          type="number"
          inputMode="numeric"
          min={MIN_TARGET_BPM}
          max={MAX_TARGET_BPM}
          step={1}
          value={targetBpm}
          disabled={pending}
          onChange={(event) => setTargetBpm(event.target.value)}
          aria-invalid={errors.targetBpm ? true : undefined}
          aria-describedby={`${bpmId}-message`}
        />
      </Field>
      {formError ? (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      ) : null}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
