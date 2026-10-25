"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  DialogState,
  SessionDraft,
  SessionSummary,
} from "@/features/practice/model";
import { usePractice } from "@/features/practice/practice-provider";
import { SessionForm } from "@/features/practice/session-form";
import {
  formatMinutes,
  formatSessionDate,
  todayInTimezone,
} from "@/lib/practice-session";

/** The log, edit and delete dialogs. Mounted once for the whole app shell. */
export function PracticeDialogs({ timezone }: Readonly<{ timezone: string }>) {
  const { dialog } = usePractice();

  if (dialog.type === "create" || dialog.type === "edit") {
    return <SessionDialog dialog={dialog} timezone={timezone} />;
  }

  if (dialog.type === "delete")
    return <DeleteDialog session={dialog.session} />;

  return null;
}

function SessionDialog({
  dialog,
  timezone,
}: Readonly<{
  dialog: Extract<DialogState, { type: "create" | "edit" }>;
  timezone: string;
}>) {
  const { closeDialog, saveSession } = usePractice();
  const today = todayInTimezone(timezone);
  const target = dialog.type === "edit" ? dialog.session : null;
  const locked = target !== null && target.entryCount > 0;
  const initial: SessionDraft =
    dialog.draft ??
    (target
      ? {
          date: target.date,
          duration: String(target.durationMinutes),
          notes: target.notes ?? "",
        }
      : { date: today, duration: "", notes: "" });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {target ? "Edit practice session" : "Log practice"}
          </DialogTitle>
          <DialogDescription>
            {target
              ? "Change the date, duration or notes of this session."
              : "How long did you play? Pick an earlier date to log past practice."}
          </DialogDescription>
        </DialogHeader>
        <SessionForm
          today={today}
          initial={initial}
          durationLocked={locked}
          failure={dialog.failure}
          submitLabel={target ? "Save changes" : "Log practice"}
          onSubmit={(values) => void saveSession(target, values)}
          onCancel={closeDialog}
        />
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ session }: Readonly<{ session: SessionSummary }>) {
  const { closeDialog, deleteSession } = usePractice();
  const entries =
    session.entryCount > 0
      ? ` This also deletes its ${session.entryCount} scale and exercise ${
          session.entryCount === 1 ? "entry" : "entries"
        }.`
      : "";

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this session?</DialogTitle>
          <DialogDescription>
            {formatSessionDate(session.date)} ·{" "}
            {formatMinutes(session.durationMinutes)}.{entries} This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void deleteSession(session)}
          >
            Delete session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
