import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { SettingsContent } from "@/features/settings/settings-content";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Account, timezone and practice preferences."
      />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="bg-muted h-80 max-w-xl animate-pulse rounded-xl"
    />
  );
}
