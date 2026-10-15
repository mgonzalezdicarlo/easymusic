import { Music2 } from "lucide-react";
import Link from "next/link";

import { env } from "@/lib/env";

export function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 font-semibold tracking-tight"
    >
      <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
        <Music2 className="size-4" aria-hidden="true" />
      </span>
      <span>{env.NEXT_PUBLIC_APP_NAME}</span>
    </Link>
  );
}
