import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/trako/BottomNav";

/** App shell. Authentication is temporarily disabled — no route protection. */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AppShell,
});

function AppShell() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
