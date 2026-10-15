import type { Metadata } from "next";

import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your practice streaks and activity at a glance."
      />
      <ComingSoonCard
        epic="Epic 3"
        items={[
          "Current and longest streak",
          "Activity heat map",
          "Weekly goal progress",
        ]}
      />
    </>
  );
}
