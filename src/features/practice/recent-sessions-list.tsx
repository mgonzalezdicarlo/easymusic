"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionSummary } from "@/features/practice/model";
import { applyPending } from "@/features/practice/pending";
import { usePractice } from "@/features/practice/practice-provider";
import { formatMinutes, formatSessionDate } from "@/lib/practice-session";
import { cn } from "@/lib/utils";

export function RecentSessionsList({
  sessions,
  limit,
}: Readonly<{ sessions: readonly SessionSummary[]; limit: number }>) {
  const { pending, openCreate, openEdit, openDelete } = usePractice();
  const rows = applyPending(sessions, pending, limit);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Recent practice</CardTitle>
        <CardDescription>
          Your latest sessions. Edit or delete them here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground text-sm">
              Nothing logged yet. Log your first session to start your streak.
            </p>
            <Button type="button" onClick={openCreate}>
              Log practice
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map(({ session, busy }) => {
              const label = formatSessionDate(session.date);

              return (
                <li
                  key={session.id}
                  aria-busy={busy || undefined}
                  className={cn(
                    "flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0",
                    busy && "opacity-60",
                  )}
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium">
                      {label} · {formatMinutes(session.durationMinutes)}
                    </p>
                    {session.entryCount > 0 ? (
                      <p className="text-muted-foreground text-xs">
                        {session.entryCount}{" "}
                        {session.entryCount === 1 ? "entry" : "entries"}
                      </p>
                    ) : null}
                    {session.notes ? (
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {session.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      aria-label={`Edit session from ${label}`}
                      onClick={() => openEdit(session)}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      aria-label={`Delete session from ${label}`}
                      onClick={() => openDelete(session)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
