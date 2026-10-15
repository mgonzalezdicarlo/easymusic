import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { env } from "@/lib/env";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        {env.NEXT_PUBLIC_APP_NAME}
      </h1>
      <p className="text-muted-foreground text-lg">
        Build a practice habit, track your scales and technical exercises, and
        watch your tempo grow.
      </p>
      <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
        Open dashboard
      </Link>
    </main>
  );
}
