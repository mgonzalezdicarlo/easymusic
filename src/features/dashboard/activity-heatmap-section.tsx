import { ActivityHeatmap } from "@/features/dashboard/activity-heatmap";
import { requirePageUser } from "@/server/auth/require-page-user";
import { getActivityDays } from "@/server/dashboard/activity";

export async function ActivityHeatmapSection() {
  const user = await requirePageUser();
  const { today, dailyGoalMinutes, days } = await getActivityDays(user.id);

  // A new user sees the welcome card from the summary instead of an empty grid.
  if (Object.keys(days).length === 0) return null;

  return (
    <ActivityHeatmap
      days={days}
      today={today}
      dailyGoalMinutes={dailyGoalMinutes}
    />
  );
}
