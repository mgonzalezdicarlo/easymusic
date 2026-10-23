import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { OnboardingGate } from "@/features/settings/onboarding-gate";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppShell>
      {children}
      <Suspense fallback={null}>
        <OnboardingGate />
      </Suspense>
    </AppShell>
  );
}
