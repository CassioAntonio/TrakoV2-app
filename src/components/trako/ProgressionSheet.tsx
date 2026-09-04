import type { ReactNode } from "react";
import { Check, Lock, Zap } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { levelLadder, progressionFor } from "@/lib/progression";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Rider progression overview. XP always reflects real saved activities. */
export function ProgressionSheet({
  xp,
  level,
  children,
}: {
  xp: number;
  level: number;
  children: ReactNode;
}) {
  const p = progressionFor(xp, level);
  const ladder = levelLadder(10);

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="max-h-[88dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display text-lg">Progressão do piloto</DrawerTitle>
          <DrawerDescription>
            Cada trilha registrada gera XP e aproxima você do próximo nível.
          </DrawerDescription>
        </DrawerHeader>

        <div className="app-scroll space-y-4 overflow-y-auto px-4 pb-8">
          <div className="surface-card px-4 py-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-display text-2xl font-bold text-primary">Nível {p.level}</p>
                <p className="text-xs text-muted-foreground">{p.title}</p>
              </div>
              <p className="text-xs text-muted-foreground">{formatNumber(p.xp)} XP</p>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.round(p.progress * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Faltam {formatNumber(p.xpForNext)} XP para o nível {p.nextLevel}
            </p>
          </div>

          <ul className="space-y-2">
            {ladder.map((l) => {
              const done = l.level < p.level;
              const current = l.level === p.level;
              return (
                <li
                  key={l.level}
                  className={cn(
                    "surface-card flex items-center gap-3 px-4 py-3",
                    current && "border-primary/60",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-sm font-bold",
                      done || current
                        ? "bg-primary/15 text-primary"
                        : "bg-surface-2 text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : current ? <Zap className="h-4 w-4" /> : l.level}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold">
                      Nível {l.level} · {l.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatNumber(l.xpRequired)} XP
                    </p>
                  </div>
                  {!done && !current && <Lock className="h-4 w-4 text-muted-foreground" />}
                </li>
              );
            })}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
