import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SignInForm } from "@/features/auth/sign-in-form";
import { githubEnabled } from "@/server/auth/providers";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <>
      <PageHeader
        title="Sign in"
        description="Welcome back. Pick up your practice where you left off."
      />
      <Card>
        <CardContent>
          <SignInForm githubEnabled={githubEnabled} />
        </CardContent>
      </Card>
    </>
  );
}
