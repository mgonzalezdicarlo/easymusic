import { RecentScaleEntries } from "@/features/scales/recent-scale-entries";
import { requirePageUser } from "@/server/auth/require-page-user";
import { getRecentScaleEntries } from "@/server/scales/recent-entries";

export async function RecentScaleEntriesSection() {
  const user = await requirePageUser();
  const entries = await getRecentScaleEntries(user.id);

  // Nothing logged yet: the catalog below is the starting point.
  if (entries.length === 0) return null;

  return <RecentScaleEntries entries={entries} />;
}
