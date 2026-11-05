import { Input } from "@/components/ui/input";
import type { FieldErrors } from "@/features/auth/schemas";
import {
  MAX_BPM,
  MIN_BPM,
  type TempoEntryDraft,
} from "@/features/practice/tempo-entry";
import { MAX_SESSION_MINUTES } from "@/lib/practice-session";

type NumberFieldProps = {
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  error?: string;
  onChange: (value: string) => void;
};

function NumberField({
  id,
  label,
  value,
  min,
  max,
  error,
  onChange,
}: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-message` : undefined}
      />
      {error ? (
        <p id={`${id}-message`} className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TempoEntryFieldsProps = {
  idPrefix: string;
  draft: TempoEntryDraft;
  errors: FieldErrors;
  onChange: (patch: Partial<TempoEntryDraft>) => void;
};

/** Clean BPM, max BPM, minutes and notes. Shared by every tempo entry form. */
export function TempoEntryFields({
  idPrefix,
  draft,
  errors,
  onChange,
}: TempoEntryFieldsProps) {
  const notesId = `${idPrefix}-notes`;

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField
          id={`${idPrefix}-clean`}
          label="Clean BPM"
          value={draft.cleanBpm}
          min={MIN_BPM}
          max={MAX_BPM}
          error={errors.cleanBpm}
          onChange={(cleanBpm) => onChange({ cleanBpm })}
        />
        <NumberField
          id={`${idPrefix}-max`}
          label="Max BPM"
          value={draft.maxBpm}
          min={MIN_BPM}
          max={MAX_BPM}
          error={errors.maxBpm}
          onChange={(maxBpm) => onChange({ maxBpm })}
        />
        <NumberField
          id={`${idPrefix}-minutes`}
          label="Minutes"
          value={draft.duration}
          min={1}
          max={MAX_SESSION_MINUTES}
          error={errors.durationMinutes}
          onChange={(duration) => onChange({ duration })}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Clean is the fastest tempo you play without mistakes. Max is the fastest
        you reached, even if it was sloppy.
      </p>
      <div className="space-y-1.5">
        <label htmlFor={notesId} className="text-sm font-medium">
          Notes (optional)
        </label>
        <textarea
          id={notesId}
          rows={2}
          value={draft.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby={errors.notes ? `${notesId}-message` : undefined}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 min-h-16 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none focus-visible:ring-3 aria-invalid:ring-3 md:text-sm"
        />
        {errors.notes ? (
          <p id={`${notesId}-message`} className="text-destructive text-sm">
            {errors.notes}
          </p>
        ) : null}
      </div>
    </div>
  );
}
