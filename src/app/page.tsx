import { env } from "@/lib/env";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">{env.NEXT_PUBLIC_APP_NAME}</h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400">
        Build a practice habit, track your scales and technical exercises, and watch your tempo
        grow.
      </p>
      <p className="text-sm text-neutral-500">Coming soon.</p>
    </main>
  );
}
