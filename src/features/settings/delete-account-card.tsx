"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteAccount, toFormFailure } from "@/features/settings/api";

const CONFIRM_WORD = "delete";

export function DeleteAccountCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const confirmed = confirmation.trim().toLowerCase() === CONFIRM_WORD;

  function onOpenChange(next: boolean) {
    if (pending) return;

    setOpen(next);

    if (!next) {
      setConfirmation("");
      setError(null);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!confirmed || pending) return;

    setError(null);
    setPending(true);

    try {
      await deleteAccount();
      toast.success("Your account and data were deleted.");
      router.push("/sign-in");
      router.refresh();
      return;
    } catch (failure) {
      setError(toFormFailure(failure).formError);
    }

    setPending(false);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Permanently delete your account and all of your practice data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setOpen(true)}
          >
            Delete my account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <form onSubmit={onSubmit} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                This permanently deletes your profile, practice sessions,
                tracked scales and exercises, custom exercises and all practice
                history. It cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <label
                htmlFor="delete-confirmation"
                className="text-sm font-medium"
              >
                Type <strong>{CONFIRM_WORD}</strong> to confirm
              </label>
              <Input
                id="delete-confirmation"
                autoComplete="off"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </div>
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
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!confirmed || pending}
              >
                {pending ? "Deleting…" : "Delete everything"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
