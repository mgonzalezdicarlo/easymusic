"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { AuthField } from "@/features/auth/auth-field";
import { authErrorMessage, GENERIC_ERROR } from "@/features/auth/messages";
import {
  type FieldErrors,
  firstFieldErrors,
  signUpSchema,
} from "@/features/auth/schemas";
import { SocialSignIn } from "@/features/auth/social-sign-in";
import { authClient } from "@/lib/auth-client";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-rules";

export function SignUpForm({
  githubEnabled,
}: Readonly<{ githubEnabled: boolean }>) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = signUpSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );

    if (!parsed.success) {
      setErrors(firstFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setPending(true);

    try {
      // Signs the new user in as well.
      const { error } = await authClient.signUp.email(parsed.data);

      if (!error) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setFormError(authErrorMessage(error));
    } catch {
      setFormError(GENERIC_ERROR);
    }

    setPending(false);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <AuthField
          id="name"
          name="name"
          label="Name"
          type="text"
          autoComplete="name"
          error={errors.name}
        />
        <AuthField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email}
        />
        <AuthField
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={errors.password}
        />
        {formError ? (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      {githubEnabled ? <SocialSignIn onError={setFormError} /> : null}
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
