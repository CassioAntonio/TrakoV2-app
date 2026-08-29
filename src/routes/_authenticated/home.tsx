import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleDot, Mountain, Timer, Route as RouteIcon } from "lucide-react";
import { Screen, StatTile, EmptyState, SectionTitle } from "@/components/trako/Screen";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { listMyActivities, getProfile } from "@/services/activities";
import { computeStats } from "@/lib/achievements";
import { formatKm, formatHours, formatNumber, formatRelative, formatDuration } from "@/lib/format";
import { DISCIPLINES } from "@/types/trako";
import type { Activity } from "@/types/trako";

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

export function disciplineLabel(id: string) {
  return DISCIPLINES.find((d) => d.id === id)?.label ?? "Trilha";
}

function Home() {
  const { user } = useAuth();
  const uid = user?.id ?? "";

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
  const name = profile?.display_name || profile?.username || "piloto";

  return (
    <Screen title={`E aí, ${name}`} subtitle="Your ride. Your trail.">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Distância" value={formatKm(stats.distanceM)} unit="km" accent />
        <StatTile label="Tempo" value={formatHours(stats.durationS)} unit="h" />
        <StatTile label="Elevação" value={formatNumber(stats.elevationM)} unit="m" />
        <StatTile label="Trilhas" value={String(stats.activities)} />
      </div>

      <div className="surface-card flex items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="font-display text-sm font-bold">Nível {stats.level}</p>
          <p className="text-xs text-muted-foreground">{formatNumber(stats.xp)} XP acumulado</p>
        </div>
        <Button asChild variant="action" size="tap">
          <Link to="/record">
            <CircleDot className="h-5 w-5" /> Gravar
          </Link>
        </Button>
      </div>

      <SectionTitle
        action={
          activities.length > 0 && (
            <Link to="/activities" className="text-xs text-primary">
              Ver tudo
            </Link>
          )
        }
      >
        Últimas trilhas
      </SectionTitle>

      {isLoading ? (
        <div className="surface-card h-24 animate-pulse" />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<RouteIcon className="h-8 w-8" />}
          title="Nenhuma trilha ainda"
          description="Sua primeira gravação começa aqui. Distância, tempo e traçado ficam salvos no seu perfil."
          action={
            <Button asChild variant="action" size="tap">
              <Link to="/record">Gravar primeira trilha</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {activities.slice(0, 5).map((a) => (
            <ActivityRow key={a.id} activity={a} />
          ))}
        </ul>
      )}
    </Screen>
  );
}

export function ActivityRow({ activity: a }: { activity: Activity }) {
  return (
    <li>
      <Link
        to="/activities/$id"
        params={{ id: a.id }}
        className="surface-card block px-4 py-3 active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold">{a.title}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {disciplineLabel(a.sport)}
              {a.place_label ? ` · ${a.place_label}` : ""} · {formatRelative(a.started_at)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <RouteIcon className="h-3.5 w-3.5" /> {formatKm(a.distance_m)} km
          </span>
          <span className="flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" /> {formatDuration(a.duration_s)}
          </span>
          <span className="flex items-center gap-1">
            <Mountain className="h-3.5 w-3.5" /> {formatNumber(a.elevation_gain_m)} m
          </span>
        </div>
      </Link>
    </li>
  );
}
