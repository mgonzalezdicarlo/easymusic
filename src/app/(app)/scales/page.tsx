import type { Metadata } from "next";

import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Scales" };

export default function ScalesPage() {
  return (
    <>
      <PageHeader
        title="Scales"
        description="Catalog and track every scale by key, mode, octaves and tempo."
      />
      <ComingSoonCard
        epic="Epic 4"
        items={[
          "Scale catalog by key and mode",
          "Clean vs. max tempo logging",
          "Progress toward target BPM",
        ]}
      />
    </>
  );
}
