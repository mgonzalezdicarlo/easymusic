import { RECENT_SESSIONS_LIMIT } from "@/features/practice/model";
import { RecentSessionsList } from "@/features/practice/recent-sessions-list";
import { requirePageUser } from "@/server/auth/require-page-user";
import { listSessions } from "@/server/sessions/sessions";

export async function RecentSessions() {
  const user = await requirePageUser();
  const { items } = await listSessions(user.id, {
    page: 1,
    pageSize: RECENT_SESSIONS_LIMIT,
  });

  return (
    <RecentSessionsList
      limit={RECENT_SESSIONS_LIMIT}
      sessions={items.map((item) => ({
        id: item.id,
        date: item.date,
        durationMinutes: item.durationMinutes,
        notes: item.notes,
        entryCount: item.scaleEntries.length + item.exerciseEntries.length,
      }))}
    />
  );
}
