import type { Metadata } from "next";
import { Suspense } from "react";

import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { PageHeader } from "@/components/layout/page-header";
import { RecentSessions } from "@/features/practice/recent-sessions";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your practice streaks and activity at a glance."
      />
      <div className="space-y-6">
        <Suspense fallback={<RecentSessionsSkeleton />}>
          <RecentSessions />
        </Suspense>
        <ComingSoonCard
          epic="Epic 3"
          items={[
            "Current and longest streak",
            "Activity heat map",
            "Weekly goal progress",
          ]}
        />
      </div>
    </>
  );
}

function RecentSessionsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="bg-muted h-56 max-w-xl animate-pulse rounded-xl"
    />
  );
}
