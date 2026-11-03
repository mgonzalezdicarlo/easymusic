import { prisma } from "@/server/db";
import { fromDbDate } from "@/server/sessions/dates";

export const RECENT_SCALE_ENTRIES_LIMIT = 10;

/** The user's latest scale entries, newest session first, for the Scales page (E4-03). */
export async function getRecentScaleEntries(
  userId: string,
  limit: number = RECENT_SCALE_ENTRIES_LIMIT,
) {
  const rows = await prisma.scalePracticeEntry.findMany({
    where: { session: { userId } },
    orderBy: [
      { session: { date: "desc" } },
      { practicedAt: "desc" },
      { id: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      sessionId: true,
      cleanBpm: true,
      maxBpm: true,
      durationMinutes: true,
      notes: true,
      session: { select: { date: true } },
      userScale: {
        select: {
          octaves: true,
          handsMode: true,
          scale: { select: { tonic: true, mode: true } },
        },
      },
    },
  });

  return rows.map(({ session, userScale, ...entry }) => ({
    ...entry,
    date: fromDbDate(session.date),
    octaves: userScale.octaves,
    handsMode: userScale.handsMode,
    tonic: userScale.scale.tonic,
    mode: userScale.scale.mode,
  }));
}
