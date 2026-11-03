"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import type { FieldErrors } from "@/features/auth/schemas";
import type { TempoEntryDraft } from "@/features/practice/tempo-entry";
import { TempoEntryFields } from "@/features/practice/tempo-entry-fields";
import {
  entryLabel,
  type EntryRow,
  type LoggableScale,
  mapFailure,
  newRow,
  parseEntryRows,
  sortLoggable,
} from "@/features/scales/practice";
import { logScalePracticeRequest } from "@/features/scales/practice-api";
import { toFormFailure } from "@/features/settings/api";

const SELECT_CLASS =
  "border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 [&>option]:bg-popover [&>option]:text-popover-foreground h-8 w-full rounded-lg border bg-transparent px-2 py-1 text-base transition-colors outline-none focus-visible:ring-3 disabled:opacity-50 md:text-sm";

type ScalePracticeFormProps = {
  /** Active tracked setups of the user, with their last entry. */
  scales: readonly LoggableScale[];
  /** The practice was saved. The parent closes the dialog. */
  onDone: () => void;
  onCancel: () => void;
};

export function ScalePracticeForm({
  scales,
  onDone,
  onCancel,
}: Readonly<ScalePracticeFormProps>) {
  const id = useId();
  const router = useRouter();
  const nextKey = useRef(0);
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [errors, setErrors] = useState<Record<string, FieldErrors>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const sorted = useMemo(() => sortLoggable(scales), [scales]);
  const byId = useMemo(
    () => new Map(scales.map((scale) => [scale.id, scale])),
    [scales],
  );
  const available = sorted.filter(
    (scale) => !rows.some((row) => row.userScaleId === scale.id),
  );
  const pickId = `${id}-pick`;

  function addScale(scaleId: string) {
    const scale = byId.get(scaleId);

    if (!scale) return;

    nextKey.current += 1;

    const row = newRow(scale, String(nextKey.current));

    setRows((current) => [...current, row]);
    setFormError(null);
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
    setErrors((current) => {
      const next = { ...current };

      delete next[key];

      return next;
    });
  }

  function updateRow(key: string, patch: Partial<TempoEntryDraft>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = parseEntryRows(rows);

    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }

    setErrors({});
    setPending(true);

    try {
      await logScalePracticeRequest(parsed.entries);
      toast.success(
        rows.length === 1
          ? "Scale practice logged."
          : `${rows.length} scales logged.`,
      );
      router.refresh();
      onDone();
      return;
    } catch (error) {
      const mapped = mapFailure(toFormFailure(error), rows);

      setErrors(mapped.rowErrors);
      setFormError(mapped.formError);
    }

    setPending(false);
  }

  if (scales.length === 0) {
    return (
      <div className="grid gap-4">
        <p className="text-muted-foreground text-sm">
          You are not tracking any scale yet.{" "}
          <Link
            href="/scales"
            onClick={onCancel}
            className="text-primary underline-offset-4 hover:underline"
          >
            Track a scale
          </Link>{" "}
          to log its tempo here.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <p className="text-muted-foreground text-sm">
        Record the tempo of the scales you practiced. They are added to
        today&apos;s session.
      </p>
      <div className="space-y-1.5">
        <label htmlFor={pickId} className="text-sm font-medium">
          Add a scale
        </label>
        <select
          id={pickId}
          value=""
          disabled={pending || available.length === 0}
          onChange={(event) => addScale(event.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">
            {available.length === 0
              ? "All your tracked scales are added"
              : "Choose a tracked scale…"}
          </option>
          {available.map((scale) => (
            <option key={scale.id} value={scale.id}>
              {entryLabel(scale)}
            </option>
          ))}
        </select>
      </div>

      {rows.length > 0 ? (
        <ul className="grid gap-3">
          {rows.map((row) => {
            const scale = byId.get(row.userScaleId);

            if (!scale) return null;

            const label = entryLabel(scale);

            return (
              <li key={row.key}>
                <fieldset
                  disabled={pending}
                  className="min-w-0 space-y-3 rounded-lg border p-3"
                >
                  <legend className="px-1 text-sm font-medium">{label}</legend>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground text-xs">
                      Target {scale.targetBpm} BPM
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove ${label}`}
                      onClick={() => removeRow(row.key)}
                    >
                      <Trash2 aria-hidden="true" />
                      Remove
                    </Button>
                  </div>
                  <TempoEntryFields
                    idPrefix={`${id}-${row.key}`}
                    draft={row}
                    errors={errors[row.key] ?? {}}
                    onChange={(patch) => updateRow(row.key, patch)}
                  />
                </fieldset>
              </li>
            );
          })}
        </ul>
      ) : null}

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
        <Button type="submit" disabled={pending || rows.length === 0}>
          {pending
            ? "Saving…"
            : rows.length > 1
              ? `Log ${rows.length} scales`
              : "Log scale"}
        </Button>
      </DialogFooter>
    </form>
  );
}
