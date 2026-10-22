"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ className }: Readonly<{ className?: string }>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);

    try {
      const { error } = await authClient.signOut();

      if (error) throw new Error(error.message);

      router.push("/sign-in");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={pending}
      onClick={signOut}
    >
      <LogOut aria-hidden="true" />
      <span className="sr-only md:not-sr-only">Sign out</span>
    </Button>
  );
}
