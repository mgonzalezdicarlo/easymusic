import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { PracticeDialogsGate } from "@/features/practice/practice-dialogs-gate";
import { PracticeProvider } from "@/features/practice/practice-provider";
import { OnboardingGate } from "@/features/settings/onboarding-gate";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PracticeProvider>
      <AppShell>
        {children}
        <Suspense fallback={null}>
          <OnboardingGate />
        </Suspense>
        <Suspense fallback={null}>
          <PracticeDialogsGate />
        </Suspense>
      </AppShell>
    </PracticeProvider>
  );
}
