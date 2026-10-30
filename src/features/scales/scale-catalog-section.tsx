import { ScaleCatalog } from "@/features/scales/scale-catalog";
import { requirePageUser } from "@/server/auth/require-page-user";
import { getScaleCatalog } from "@/server/scales/catalog";

export async function ScaleCatalogSection() {
  const user = await requirePageUser();
  const { scales, trackedCounts } = await getScaleCatalog(user.id);

  return <ScaleCatalog scales={scales} trackedCounts={trackedCounts} />;
}
