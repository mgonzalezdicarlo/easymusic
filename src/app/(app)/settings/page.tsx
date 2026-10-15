import type { Metadata } from "next";

import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Account, timezone and practice preferences."
      />
      <ComingSoonCard
        epic="Epic 3"
        items={[
          "Display name and timezone",
          "Daily practice goal",
          "Data export and account deletion",
        ]}
      />
    </>
  );
}
