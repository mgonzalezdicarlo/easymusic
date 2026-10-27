import { DashboardEmptyState } from "@/features/dashboard/empty-state";
import { StatCards } from "@/features/dashboard/stat-cards";
import { WeeklyGoalCard } from "@/features/dashboard/weekly-goal-card";
import { LogPracticeButton } from "@/features/practice/log-practice-button";
import { requirePageUser } from "@/server/auth/require-page-user";
import { getDashboardSummary } from "@/server/dashboard/service";

export async function DashboardSummary() {
  const user = await requirePageUser();
  const { streaks, minutesThisWeek, sessionsThisMonth, weeklyGoal } =
    await getDashboardSummary(user.id);

  if (streaks.totalSessions === 0) {
    return <DashboardEmptyState action={<LogPracticeButton />} />;
  }

  return (
    <div className="space-y-6">
      <StatCards
        currentStreak={streaks.currentStreak}
        longestStreak={streaks.longestStreak}
        practicedToday={streaks.practicedToday}
        minutesThisWeek={minutesThisWeek}
        sessionsThisMonth={sessionsThisMonth}
      />
      <WeeklyGoalCard goal={weeklyGoal} action={<LogPracticeButton />} />
    </div>
  );
}
