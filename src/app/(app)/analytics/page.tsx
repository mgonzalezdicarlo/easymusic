import type { Metadata } from "next";

import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Tempo progression and practice time distribution."
      />
      <ComingSoonCard
        epic="Epic 6"
        items={[
          "BPM progression line charts",
          "Practice time by category",
          "Biggest improvements",
        ]}
      />
    </>
  );
}
