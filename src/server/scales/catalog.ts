import { prisma } from "@/server/db";

/**
 * The whole shared scale catalog (108 rows) plus, per scale, how many ACTIVE configurations
 * the user tracks (E4-01). Archived configurations do not count as tracked.
 */
export async function getScaleCatalog(userId: string) {
  const [scales, tracked] = await Promise.all([
    prisma.scale.findMany({
      select: { id: true, tonic: true, mode: true },
      orderBy: [{ mode: "asc" }, { tonic: "asc" }],
    }),
    prisma.userScale.groupBy({
      by: ["scaleId"],
      where: { userId, status: "ACTIVE" },
      _count: { _all: true },
    }),
  ]);
  const trackedCounts: Record<string, number> = {};

  for (const row of tracked) {
    trackedCounts[row.scaleId] = row._count._all;
  }

  return { scales, trackedCounts };
}
