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
  signInSchema,
} from "@/features/auth/schemas";
import { SocialSignIn } from "@/features/auth/social-sign-in";
import { authClient } from "@/lib/auth-client";

export function SignInForm({
  githubEnabled,
}: Readonly<{ githubEnabled: boolean }>) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = signInSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );

    if (!parsed.success) {
      setErrors(firstFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setPending(true);

    try {
      const { error } = await authClient.signIn.email(parsed.data);

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
          autoComplete="current-password"
          error={errors.password}
        />
        {formError ? (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      {githubEnabled ? <SocialSignIn onError={setFormError} /> : null}
      <p className="text-muted-foreground text-center text-sm">
        New here?{" "}
        <Link
          href="/sign-up"
          className="text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
