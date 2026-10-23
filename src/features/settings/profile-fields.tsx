import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import type { FieldErrors } from "@/features/auth/schemas";
import { TimezoneSelect } from "@/features/settings/timezone-select";
import {
  MAX_DAILY_GOAL_MINUTES,
  MAX_NAME_LENGTH,
  MIN_DAILY_GOAL_MINUTES,
} from "@/lib/user-preferences";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
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
          className={
            error ? "text-destructive text-sm" : "text-muted-foreground text-sm"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

type ProfileFieldsProps = {
  idPrefix: string;
  timezones: readonly string[];
  timezone: string;
  onTimezoneChange: (value: string) => void;
  goal: string;
  onGoalChange: (value: string) => void;
  errors: FieldErrors;
  /** Include the display name field when set. */
  nameField?: { value: string; onChange: (value: string) => void };
};

/** Fields shared by the settings form and the first-run prompt. */
export function ProfileFields({
  idPrefix,
  timezones,
  timezone,
  onTimezoneChange,
  goal,
  onGoalChange,
  errors,
  nameField,
}: ProfileFieldsProps) {
  const nameId = `${idPrefix}-name`;
  const timezoneId = `${idPrefix}-timezone`;
  const goalId = `${idPrefix}-goal`;

  return (
    <>
      {nameField ? (
        <Field id={nameId} label="Display name" error={errors.name}>
          <Input
            id={nameId}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={MAX_NAME_LENGTH * 2}
            value={nameField.value}
            onChange={(event) => nameField.onChange(event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${nameId}-message` : undefined}
          />
        </Field>
      ) : null}
      <Field
        id={timezoneId}
        label="Timezone"
        error={errors.timezone}
        hint="Decides which day a session counts for in your streaks and goals."
      >
        <TimezoneSelect
          id={timezoneId}
          value={timezone}
          onChange={onTimezoneChange}
          timezones={timezones}
          invalid={Boolean(errors.timezone)}
          describedBy={`${timezoneId}-message`}
        />
      </Field>
      <Field
        id={goalId}
        label="Daily practice goal (minutes)"
        error={errors.dailyGoalMinutes}
        hint="Sets the intensity levels of your activity heat map and weekly goal."
      >
        <Input
          id={goalId}
          name="dailyGoalMinutes"
          type="number"
          inputMode="numeric"
          min={MIN_DAILY_GOAL_MINUTES}
          max={MAX_DAILY_GOAL_MINUTES}
          step={1}
          value={goal}
          onChange={(event) => onGoalChange(event.target.value)}
          aria-invalid={errors.dailyGoalMinutes ? true : undefined}
          aria-describedby={`${goalId}-message`}
        />
      </Field>
    </>
  );
}
