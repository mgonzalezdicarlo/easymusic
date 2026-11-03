"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { entryLabel, type RecentScaleEntry } from "@/features/scales/practice";
import {
  DeleteScaleEntryDialog,
  EditScaleEntryDialog,
} from "@/features/scales/scale-entry-dialogs";
import { formatMinutes, formatSessionDate } from "@/lib/practice-session";

type DialogState =
  | { type: "closed" }
  | { type: "edit"; entry: RecentScaleEntry }
  | { type: "delete"; entry: RecentScaleEntry };

const CLOSED: DialogState = { type: "closed" };

export function RecentScaleEntries({
  entries,
}: Readonly<{ entries: readonly RecentScaleEntry[] }>) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(CLOSED);

  function finish() {
    setDialog(CLOSED);
    router.refresh();
  }

  return (
    <>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Recent scale practice</CardTitle>
          <CardDescription>
            Your latest entries. Edit or delete them here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {entries.map((entry) => {
              const label = entryLabel(entry);
              const date = formatSessionDate(entry.date);

              return (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-muted-foreground text-xs">
                      {date} · Clean {entry.cleanBpm} · Max {entry.maxBpm} BPM ·{" "}
                      {formatMinutes(entry.durationMinutes)}
                    </p>
                    {entry.notes ? (
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {entry.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit entry: ${label}, ${date}`}
                      onClick={() => setDialog({ type: "edit", entry })}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete entry: ${label}, ${date}`}
                      onClick={() => setDialog({ type: "delete", entry })}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {dialog.type === "edit" ? (
        <EditScaleEntryDialog
          key={dialog.entry.id}
          entry={dialog.entry}
          onClose={() => setDialog(CLOSED)}
          onDone={finish}
        />
      ) : null}
      {dialog.type === "delete" ? (
        <DeleteScaleEntryDialog
          key={dialog.entry.id}
          entry={dialog.entry}
          onClose={() => setDialog(CLOSED)}
          onDone={finish}
        />
      ) : null}
    </>
  );
}
