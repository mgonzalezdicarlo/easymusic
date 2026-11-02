import { prisma } from "@/server/db";

/**
 * The whole shared scale catalog (108 rows) plus the user's setups per scale id (E4-01, E4-02).
 * A setup is one configuration (octaves x hands mode). Archived setups are included, because
 * they still own their configuration and the UI offers to restore them.
 */
export async function getScaleCatalog(userId: string) {
  const [scales, tracked] = await Promise.all([
    prisma.scale.findMany({
      select: { id: true, tonic: true, mode: true },
      orderBy: [{ mode: "asc" }, { tonic: "asc" }],
    }),
    prisma.userScale.findMany({
      where: { userId },
      select: {
        id: true,
        scaleId: true,
        octaves: true,
        handsMode: true,
        targetBpm: true,
        status: true,
      },
      orderBy: [{ octaves: "asc" }, { handsMode: "asc" }, { id: "asc" }],
    }),
  ]);
  const setups: Record<string, Omit<(typeof tracked)[number], "scaleId">[]> =
    {};

  for (const { scaleId, ...setup } of tracked) {
    const list = setups[scaleId];

    if (list) list.push(setup);
    else setups[scaleId] = [setup];
  }

  return { scales, setups };
}
