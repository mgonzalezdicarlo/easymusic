"use client";

import { type FormEvent, useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GENERIC_ERROR } from "@/features/auth/messages";
import type { FieldErrors } from "@/features/auth/schemas";
import {
  changedTempoFields,
  parseTempoDraft,
  type TempoEntryDraft,
  toEntryPayload,
} from "@/features/practice/tempo-entry";
import { TempoEntryFields } from "@/features/practice/tempo-entry-fields";
import { entryLabel, type RecentScaleEntry } from "@/features/scales/practice";
import {
  deleteScaleEntryRequest,
  updateScaleEntryRequest,
} from "@/features/scales/practice-api";
import { toFormFailure } from "@/features/settings/api";
import { formatSessionDate } from "@/lib/practice-session";

type DialogProps = {
  entry: RecentScaleEntry;
  onClose: () => void;
  /** The change was saved. The parent closes the dialog and refreshes the data. */
  onDone: () => void;
};

export function EditScaleEntryDialog({
  entry,
  onClose,
  onDone,
}: Readonly<DialogProps>) {
  const id = useId();
  const [draft, setDraft] = useState<TempoEntryDraft>({
    cleanBpm: String(entry.cleanBpm),
    maxBpm: String(entry.maxBpm),
    duration: String(entry.durationMinutes),
    notes: entry.notes ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = parseTempoDraft(draft);

    if (!parsed.success) {
      setErrors(parsed.errors);
      return;
    }

    const patch = changedTempoFields(entry, toEntryPayload(parsed.data));

    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }

    setErrors({});
    setPending(true);

    try {
      await updateScaleEntryRequest(entry.sessionId, entry.id, patch);
      toast.success("Scale entry updated.");
      onDone();
      return;
    } catch (error) {
      const failure = toFormFailure(error);

      setErrors(failure.fieldErrors);
      setFormError(failure.formError);
    }

    setPending(false);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit scale entry</DialogTitle>
          <DialogDescription>
            {entryLabel(entry)} · {formatSessionDate(entry.date)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <fieldset disabled={pending} className="min-w-0">
            <TempoEntryFields
              idPrefix={id}
              draft={draft}
              errors={errors}
              onChange={(patch) =>
                setDraft((current) => ({ ...current, ...patch }))
              }
            />
          </fieldset>
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
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteScaleEntryDialog({
  entry,
  onClose,
  onDone,
}: Readonly<DialogProps>) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function confirm() {
    setError(null);
    setPending(true);

    try {
      await deleteScaleEntryRequest(entry.sessionId, entry.id);
      toast.success("Scale entry deleted.");
      onDone();
      return;
    } catch (failure) {
      setError(toFormFailure(failure).formError ?? GENERIC_ERROR);
    }

    setPending(false);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this entry?</DialogTitle>
          <DialogDescription>
            {entryLabel(entry)} · {formatSessionDate(entry.date)}. This cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => void confirm()}
          >
            {pending ? "Deleting…" : "Delete entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
