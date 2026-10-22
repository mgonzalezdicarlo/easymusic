import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { githubEnabled } from "@/server/auth/providers";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <>
      <PageHeader
        title="Create account"
        description="Start tracking your practice, scales and exercises."
      />
      <Card>
        <CardContent>
          <SignUpForm githubEnabled={githubEnabled} />
        </CardContent>
      </Card>
    </>
  );
}
