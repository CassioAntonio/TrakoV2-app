import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CircleDot,
  Route as RouteIcon,
  Trophy,
  BarChart3,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { Screen, StatTile, EmptyState } from "@/components/trako/Screen";
import { Button } from "@/components/ui/button";
import { RiderAvatar } from "@/components/trako/RiderAvatar";
import { ProfileEditor } from "@/components/trako/ProfileEditor";
import { ProgressionSheet } from "@/components/trako/ProgressionSheet";
import { ActivityRow } from "@/components/trako/ActivityCard";
import { useAuth } from "@/hooks/useAuth";
import { listMyActivities, getProfile } from "@/services/activities";
import { computeStats, computeAchievements } from "@/lib/achievements";
import { progressionFor } from "@/lib/progression";
import { formatKm, formatHours, formatNumber, formatSpeed } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Início — TRAKO" },
      { name: "description", content: "Resumo das suas trilhas, distância, tempo e elevação." },
      { property: "og:title", content: "Início — TRAKO" },
      { property: "og:description", content: "Seu painel de piloto no TRAKO." },
    ],
  }),
  component: Home,
});

type Tab = "trilhas" | "conquistas" | "estatisticas";

const TABS: { id: Tab; label: string }[] = [
  { id: "trilhas", label: "Trilhas" },
  { id: "conquistas", label: "Conquistas" },
  { id: "estatisticas", label: "Estatísticas" },
];

function Home() {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const [tab, setTab] = useState<Tab>("trilhas");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities", uid],
    queryFn: () => listMyActivities(uid),
    enabled: !!uid,
  });
  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: () => getProfile(uid),
    enabled: !!uid,
  });

  const stats = computeStats(activities);
  const p = progressionFor(stats.xp, stats.level);
  const achievements = computeAchievements(activities, stats);
  const name = profile?.display_name || profile?.username || "Piloto TRAKO";

  return (
    <Screen>
      <div className="pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]" />

      {/* Rider card */}
      <section className="surface-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-4">
          <RiderAvatar path={profile?.avatar_url} name={name} className="h-16 w-16" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.bike || "Adicione sua moto na Garagem"}
            </p>
          </div>
          <ProfileEditor userId={uid} profile={profile}>
            <Button variant="outline" size="icon" aria-label="Editar perfil">
              <Pencil className="h-4 w-4" />
            </Button>
          </ProfileEditor>
        </div>

        <ProgressionSheet xp={stats.xp} level={stats.level}>
          <button type="button" className="mt-4 w-full px-4 text-left active:opacity-80">
            <div className="flex items-end justify-between">
              <p className="font-display text-sm font-bold text-primary">
                Nível {p.level} · {p.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {formatNumber(stats.xp)} XP <ChevronRight className="inline h-3 w-3" />
              </p>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.round(p.progress * 100)}%` }}
              />
            </div>
          </button>
        </ProgressionSheet>

        <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border">
          <Metric label="km" value={formatKm(stats.distanceM)} />
          <Metric label="horas" value={formatHours(stats.durationS)} />
          <Metric label="trilhas" value={String(stats.activities)} />
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
              tab === t.id ? "bg-background text-primary" : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "trilhas" &&
        (isLoading ? (
          <div className="surface-card h-24 animate-pulse" />
        ) : activities.length === 0 ? (
          <EmptyState
            icon={<RouteIcon className="h-8 w-8" />}
            title="Nenhuma trilha ainda"
            description="Sua primeira gravação começa aqui. Distância, tempo e traçado ficam salvos no seu perfil."
            action={
              <Button asChild variant="action" size="tap">
                <Link to="/record">
                  <CircleDot className="h-5 w-5" /> Gravar primeira trilha
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            <ul className="space-y-3">
              {activities.slice(0, 6).map((a) => (
                <ActivityRow key={a.id} activity={a} />
              ))}
            </ul>
            <Button asChild variant="outline" size="tap" className="w-full">
              <Link to="/activities">Ver todas as trilhas</Link>
            </Button>
          </>
        ))}

      {tab === "conquistas" && (
        <ul className="space-y-2">
          {achievements.map((a) => (
            <li key={a.id} className="surface-card flex items-center gap-3 px-4 py-3">
              <div
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  a.unlocked ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground",
                )}
              >
                <Trophy className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold">{a.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{a.description}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round(a.progress * 100)}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "estatisticas" && (
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Distância" value={formatKm(stats.distanceM)} unit="km" accent />
          <StatTile label="Tempo" value={formatHours(stats.durationS)} unit="h" />
          <StatTile label="Elevação" value={formatNumber(stats.elevationM)} unit="m" />
          <StatTile label="Vel. máxima" value={formatSpeed(stats.maxSpeedKmh)} unit="km/h" />
          <StatTile label="Trilhas" value={String(stats.activities)} />
          <StatTile label="XP" value={formatNumber(stats.xp)} />
          {stats.activities === 0 && (
            <p className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
              <BarChart3 className="h-4 w-4" /> Seus números aparecem aqui após a primeira trilha.
            </p>
          )}
        </div>
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-3 text-center">
      <p className="metric-value text-xl">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
