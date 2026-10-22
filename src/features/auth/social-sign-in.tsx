"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authErrorMessage, GENERIC_ERROR } from "@/features/auth/messages";
import { authClient } from "@/lib/auth-client";

export function SocialSignIn({
  onError,
}: Readonly<{ onError: (message: string) => void }>) {
  const [pending, setPending] = useState(false);

  async function signInWithGithub() {
    setPending(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      });

      // Without an error the browser is already being redirected to GitHub.
      if (!error) return;

      onError(authErrorMessage(error));
    } catch {
      onError(GENERIC_ERROR);
    }

    setPending(false);
  }

  return (
    <>
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        or
        <span className="bg-border h-px flex-1" />
      </div>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={signInWithGithub}
      >
        Continue with GitHub
      </Button>
    </>
  );
}
