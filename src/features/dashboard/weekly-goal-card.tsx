import type { ReactNode } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMinutes } from "@/lib/practice-session";
import type { GoalProgress } from "@/server/dashboard/dashboard";

type WeeklyGoalCardProps = {
  goal: GoalProgress;
  /** Call to action shown in the card header, for example the "Log practice" button. */
  action?: ReactNode;
};

export function WeeklyGoalCard({
  goal,
  action,
}: Readonly<WeeklyGoalCardProps>) {
  const { goalMinutes, minutes, percent, reached } = goal;

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Weekly goal</CardTitle>
        <CardDescription>
          {`${formatMinutes(minutes)} of ${formatMinutes(goalMinutes)}`}
        </CardDescription>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className="space-y-2">
        <div
          role="progressbar"
          aria-label="Weekly practice goal progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="bg-muted h-2 overflow-hidden rounded-full"
        >
          <div
            className="bg-primary h-full rounded-full transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-sm">
          {reached
            ? "Goal reached. Great work this week!"
            : `${formatMinutes(goalMinutes - minutes)} to go this week.`}
        </p>
        <p className="text-muted-foreground text-xs">
          Your weekly goal is your daily goal times seven. Weeks run from Monday
          to Sunday.
        </p>
      </CardContent>
    </Card>
  );
}
