import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, CircleDot, ListChecks, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/explore", label: "Explorar", icon: Compass },
  { to: "/activities", label: "Atividades", icon: ListChecks },
  { to: "/profile", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const recording = pathname.startsWith("/record");

  return (
    <nav className="safe-bottom relative z-30 border-t border-border bg-background/95 pt-1 backdrop-blur">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-2">
        {items.slice(0, 2).map((i) => (
          <NavItem key={i.to} {...i} active={pathname.startsWith(i.to)} />
        ))}

        <div className="flex justify-center">
          <Link
            to="/record"
            aria-label="Gravar trilha"
            className={cn(
              "-mt-7 flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground glow transition-transform active:scale-95",
              recording && "ring-4 ring-primary/30",
            )}
          >
            <CircleDot className="h-6 w-6" />
            <span className="font-display text-[10px] font-bold uppercase tracking-wider">
              Gravar
            </span>
          </Link>
        </div>

        {items.slice(2).map((i) => (
          <NavItem key={i.to} {...i} active={pathname.startsWith(i.to)} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_var(--primary)]")} />
      {label}
    </Link>
  );
}
