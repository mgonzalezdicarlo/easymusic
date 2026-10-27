import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DashboardEmptyState({
  action,
}: Readonly<{ action: ReactNode }>) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Start your practice streak</CardTitle>
        <CardDescription>
          Log your first session to see your streaks, weekly goal and progress
          here.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        <p className="text-muted-foreground text-sm">
          It takes a few seconds. To add practice you already did, pick an
          earlier date.
        </p>
        {action}
      </CardContent>
    </Card>
  );
}
