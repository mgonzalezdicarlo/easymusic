"use client";

import { type FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type FieldErrors, firstFieldErrors } from "@/features/auth/schemas";
import type { FormFailure, SessionDraft } from "@/features/practice/model";
import {
  MAX_SESSION_MINUTES,
  MIN_SESSION_DATE,
  sessionFormSchema,
  type SessionFormValues,
} from "@/lib/practice-session";
import { parseGoalInput } from "@/lib/user-preferences";
import { cn } from "@/lib/utils";

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

type SessionFormProps = {
  /** The user's current date (YYYY-MM-DD). Later dates are rejected. */
  today: string;
  initial: SessionDraft;
  submitLabel: string;
  /** The duration is calculated from the session's entries and cannot be edited. */
  durationLocked?: boolean;
  /** Errors from a failed save, shown when the form reopens. */
  failure?: FormFailure;
  onSubmit: (values: SessionFormValues) => void;
  onCancel: () => void;
};

export function SessionForm({
  today,
  initial,
  submitLabel,
  durationLocked = false,
  failure,
  onSubmit,
  onCancel,
}: SessionFormProps) {
  const id = useId();
  const [duration, setDuration] = useState(initial.duration);
  const [date, setDate] = useState(initial.date);
  const [notes, setNotes] = useState(initial.notes);
  const [errors, setErrors] = useState<FieldErrors>(failure?.fieldErrors ?? {});
  const [formError, setFormError] = useState<string | null>(
    failure?.formError ?? null,
  );

  const durationId = `${id}-duration`;
  const dateId = `${id}-date`;
  const notesId = `${id}-notes`;
  const durationHint = durationLocked
    ? "Calculated from this session's entries."
    : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = sessionFormSchema(today, { durationLocked }).safeParse({
      date,
      durationMinutes: parseGoalInput(duration),
      notes,
    });

    if (!parsed.success) {
      setErrors(firstFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <Field
        id={durationId}
        label="Duration (minutes)"
        error={errors.durationMinutes}
        hint={durationHint}
      >
        <Input
          id={durationId}
          name="durationMinutes"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_SESSION_MINUTES}
          step={1}
          value={duration}
          disabled={durationLocked}
          onChange={(event) => setDuration(event.target.value)}
          aria-invalid={errors.durationMinutes ? true : undefined}
          aria-describedby={
            errors.durationMinutes || durationHint
              ? `${durationId}-message`
              : undefined
          }
        />
      </Field>
      <Field id={dateId} label="Date" error={errors.date}>
        <Input
          id={dateId}
          name="date"
          type="date"
          min={MIN_SESSION_DATE}
          max={today}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-invalid={errors.date ? true : undefined}
          aria-describedby={errors.date ? `${dateId}-message` : undefined}
        />
      </Field>
      <Field id={notesId} label="Notes (optional)" error={errors.notes}>
        <textarea
          id={notesId}
          name="notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby={errors.notes ? `${notesId}-message` : undefined}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 min-h-20 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none focus-visible:ring-3 aria-invalid:ring-3 md:text-sm"
        />
      </Field>
      {formError ? (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}
