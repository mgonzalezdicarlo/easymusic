import type { Metadata } from "next";

import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Exercises" };

export default function ExercisesPage() {
  return (
    <>
      <PageHeader
        title="Exercises"
        description="Hanon, Czerny and your own technical exercises."
      />
      <ComingSoonCard
        epic="Epic 5"
        items={[
          "Hanon exercises 1–60",
          "Custom exercises and Czerny studies",
          "Tempo history per exercise",
        ]}
      />
    </>
  );
}
