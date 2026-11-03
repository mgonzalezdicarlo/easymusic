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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  DialogState,
  SessionDraft,
  SessionSummary,
} from "@/features/practice/model";
import { usePractice } from "@/features/practice/practice-provider";
import { SessionForm } from "@/features/practice/session-form";
import type { LoggableScale } from "@/features/scales/practice";
import { ScalePracticeForm } from "@/features/scales/scale-practice-form";
import {
  formatMinutes,
  formatSessionDate,
  todayInTimezone,
} from "@/lib/practice-session";

/** The log, edit and delete dialogs. Mounted once for the whole app shell. */
export function PracticeDialogs({
  timezone,
  scales,
}: Readonly<{ timezone: string; scales: readonly LoggableScale[] }>) {
  const { dialog } = usePractice();

  if (dialog.type === "create" || dialog.type === "edit") {
    return (
      <SessionDialog dialog={dialog} timezone={timezone} scales={scales} />
    );
  }

  if (dialog.type === "delete")
    return <DeleteDialog session={dialog.session} />;

  return null;
}

function SessionDialog({
  dialog,
  timezone,
  scales,
}: Readonly<{
  dialog: Extract<DialogState, { type: "create" | "edit" }>;
  timezone: string;
  scales: readonly LoggableScale[];
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
  const form = (
    <SessionForm
      today={today}
      initial={initial}
      durationLocked={locked}
      failure={dialog.failure}
      submitLabel={target ? "Save changes" : "Log practice"}
      onSubmit={(values) => void saveSession(target, values)}
      onCancel={closeDialog}
    />
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
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
        {target ? (
          form
        ) : (
          <Tabs defaultValue="session">
            <TabsList className="w-full">
              <TabsTrigger value="session">Quick log</TabsTrigger>
              <TabsTrigger value="scales">Scales</TabsTrigger>
            </TabsList>
            <TabsContent value="session" keepMounted className="pt-2">
              {form}
            </TabsContent>
            <TabsContent value="scales" keepMounted className="pt-2">
              <ScalePracticeForm
                scales={scales}
                onDone={closeDialog}
                onCancel={closeDialog}
              />
            </TabsContent>
          </Tabs>
        )}
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
