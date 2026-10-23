"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { type FieldErrors, firstFieldErrors } from "@/features/auth/schemas";
import { saveProfile, toFormFailure } from "@/features/settings/api";
import { ProfileFields } from "@/features/settings/profile-fields";
import { parseGoalInput, profileSchema } from "@/lib/user-preferences";

type SettingsFormProps = {
  name: string;
  timezone: string;
  dailyGoalMinutes: number;
  timezones: readonly string[];
};

export function SettingsForm({
  name: initialName,
  timezone: initialTimezone,
  dailyGoalMinutes,
  timezones,
}: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [goal, setGoal] = useState(String(dailyGoalMinutes));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = profileSchema.safeParse({
      name,
      timezone,
      dailyGoalMinutes: parseGoalInput(goal),
    });

    if (!parsed.success) {
      setErrors(firstFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setPending(true);

    try {
      await saveProfile(parsed.data);
      toast.success("Settings saved.");
      router.refresh();
    } catch (error) {
      const failure = toFormFailure(error);

      setErrors(failure.fieldErrors);
      setFormError(failure.formError);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <ProfileFields
        idPrefix="settings"
        timezones={timezones}
        timezone={timezone}
        onTimezoneChange={setTimezone}
        goal={goal}
        onGoalChange={setGoal}
        errors={errors}
        nameField={{ value: name, onChange: setName }}
      />
      {formError ? (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
