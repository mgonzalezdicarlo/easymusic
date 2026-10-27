import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { ActivityHeatmapSection } from "@/features/dashboard/activity-heatmap-section";
import { DashboardSummary } from "@/features/dashboard/dashboard-summary";
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
        <Suspense fallback={<SummarySkeleton />}>
          <DashboardSummary />
        </Suspense>
        {/* Replace with the activity heat map when E3-05 is merged. */}
        <Suspense fallback={<HeatmapSkeleton />}>
          <ActivityHeatmapSection />
        </Suspense>
        <Suspense fallback={<RecentSessionsSkeleton />}>
          <RecentSessions />
        </Suspense>
      </div>
    </>
  );
}

function SummarySkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="bg-muted h-24 animate-pulse rounded-xl" />
        ))}
      </div>
      <div className="bg-muted h-40 max-w-xl animate-pulse rounded-xl" />
    </div>
  );
}

function HeatmapSkeleton() {
  return (
    <div aria-busy="true" className="bg-muted h-56 animate-pulse rounded-xl" />
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
