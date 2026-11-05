import { prisma } from "@/server/db";

/**
 * Active tracked scale setups with their latest entry, for the scales tab of the
 * "Log practice" dialog (E4-03). The client sorts and labels them.
 */
export async function getLoggableScales(userId: string) {
  const rows = await prisma.userScale.findMany({
    where: { userId, status: "ACTIVE" },
    select: {
      id: true,
      octaves: true,
      handsMode: true,
      targetBpm: true,
      scale: { select: { tonic: true, mode: true } },
      entries: {
        orderBy: [{ practicedAt: "desc" }, { id: "desc" }],
        take: 1,
        select: { cleanBpm: true, maxBpm: true, durationMinutes: true },
      },
    },
  });

  return rows.map(({ scale, entries, ...setup }) => ({
    ...setup,
    tonic: scale.tonic,
    mode: scale.mode,
    last: entries[0] ?? null,
  }));
}
