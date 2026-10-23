"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type FieldErrors, firstFieldErrors } from "@/features/auth/schemas";
import { saveProfile, toFormFailure } from "@/features/settings/api";
import { ProfileFields } from "@/features/settings/profile-fields";
import { useDetectedTimezone } from "@/features/settings/use-detected-timezone";
import { onboardingSchema, parseGoalInput } from "@/lib/user-preferences";

type OnboardingDialogProps = {
  timezone: string;
  dailyGoalMinutes: number;
  timezones: readonly string[];
};

// The prompt stays open until the user saves, so it ignores close requests.
const keepOpen = () => undefined;

export function OnboardingDialog({
  timezone: storedTimezone,
  dailyGoalMinutes,
  timezones,
}: OnboardingDialogProps) {
  const router = useRouter();
  const detected = useDetectedTimezone();
  const [picked, setPicked] = useState<string | null>(null);
  const [goal, setGoal] = useState(String(dailyGoalMinutes));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(true);
  // The user's choice, else the browser's timezone, else the stored default.
  const timezone = picked ?? detected ?? storedTimezone;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = onboardingSchema.safeParse({
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
      await saveProfile({ ...parsed.data, completeOnboarding: true });
      setOpen(false);
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
    <Dialog open={open} onOpenChange={keepOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Welcome! Set up your practice</DialogTitle>
            <DialogDescription>
              Your timezone decides which day a session counts for, and your
              goal sets your heat map levels. You can change both later in
              Settings.
            </DialogDescription>
          </DialogHeader>
          <ProfileFields
            idPrefix="onboarding"
            timezones={timezones}
            timezone={timezone}
            onTimezoneChange={setPicked}
            goal={goal}
            onGoalChange={setGoal}
            errors={errors}
          />
          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Get started"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
