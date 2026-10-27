import { Card, CardContent } from "@/components/ui/card";
import { formatMinutes } from "@/lib/practice-session";

type StatCardsProps = {
  currentStreak: number;
  longestStreak: number;
  practicedToday: boolean;
  minutesThisWeek: number;
  sessionsThisMonth: number;
};

const days = (count: number) => `${count} ${count === 1 ? "day" : "days"}`;

function streakHint(currentStreak: number, practicedToday: boolean) {
  if (practicedToday) return "Practiced today.";
  if (currentStreak > 0) return "Practice today to keep it going.";

  return "Practice today to start a new streak.";
}

function Stat({
  label,
  value,
  hint,
}: Readonly<{ label: string; value: string; hint?: string }>) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function StatCards({
  currentStreak,
  longestStreak,
  practicedToday,
  minutesThisWeek,
  sessionsThisMonth,
}: Readonly<StatCardsProps>) {
  return (
    <section
      aria-label="Practice summary"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      <Stat
        label="Current streak"
        value={days(currentStreak)}
        hint={streakHint(currentStreak, practicedToday)}
      />
      <Stat label="Longest streak" value={days(longestStreak)} />
      <Stat label="Minutes this week" value={formatMinutes(minutesThisWeek)} />
      <Stat label="Sessions this month" value={String(sessionsThisMonth)} />
    </section>
  );
}
