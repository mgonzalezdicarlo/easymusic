import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { ScaleCatalogSection } from "@/features/scales/scale-catalog-section";

export const metadata: Metadata = { title: "Scales" };

export default function ScalesPage() {
  return (
    <>
      <PageHeader
        title="Scales"
        description="Catalog and track every scale by key, mode, octaves and tempo."
      />
      <Suspense fallback={<CatalogSkeleton />}>
        <ScaleCatalogSection />
      </Suspense>
    </>
  );
}

function CatalogSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="bg-muted h-16 max-w-xl animate-pulse rounded-xl" />
      <div className="bg-muted h-96 animate-pulse rounded-xl" />
    </div>
  );
}
