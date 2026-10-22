import { BottomNav } from "@/components/layout/bottom-nav";
import { Brand } from "@/components/layout/brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground sr-only rounded-md px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
      >
        Skip to content
      </a>

      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden border-r md:sticky md:top-0 md:flex md:h-dvh md:flex-col">
        <div className="flex h-14 items-center px-6">
          <Brand />
        </div>
        <SidebarNav />
        <div className="border-sidebar-border border-t px-4 py-3">
          <SignOutButton className="w-full justify-start" />
        </div>
        <div className="border-sidebar-border flex items-center justify-between border-t px-4 py-3">
          <span className="text-muted-foreground text-xs font-medium">
            Theme
          </span>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="bg-background/95 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur md:hidden">
          <Brand />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-6 pb-24 focus:outline-none md:px-8 md:py-8 md:pb-8"
        >
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
