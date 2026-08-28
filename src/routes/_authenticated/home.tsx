import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleDot, Gauge, MapPin, Mountain, Timer } from "lucide-react";
import { Screen, SectionTitle, StatTile, EmptyState } from "@/components/trako/Screen";
import { TrakoLogo } from "@/components/trako/Brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { listMyActivities, getProfile } from "@/services/activities";
import { computeStats } from "@/lib/achievements";
import { formatDistance, formatHours, formatNumber, formatRelative, formatKm } from "@/lib/format";
import { reverseGeocode } from "@/lib/geo";
import { useEffect, useState } from "react";
import type { Activity } from "@/types/trako";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Início — TRAKO" },
      { name: "description", content: "Seu resumo de piloto: distância, tempo e últimas trilhas." },
      { property: "og:title", content: "Início — TRAKO" },
      { property: "og:description", content: "Resumo do piloto e últimas trilhas gravadas." },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const { fix, status } = useGeolocation({ auto: true });
  const [place, setPlace] = useState<string | null>(null);

  const activities = useQuery({
    queryKey: ["my-activities", uid],
    queryFn: () => listMyActivities(uid),
    enabled: !!uid,
  });
  const profile = useQuery({
    queryKey: ["profile", uid],
    queryFn: () => getProfile(uid),
    enabled: !!uid,
  });

  useEffect(() => {
    if (!fix) return;
    let alive = true;
    reverseGeocode(fix.lat, fix.lng).then((p) => alive && setPlace(p));
    return () => {
      alive = false;
    };
  }, [fix]);

  const list = activities.data ?? [];
  const stats = computeStats(list);
  const dist = formatDistance(stats.distanceM);
  const name = profile.data?.display_name ?? "piloto";

  return (
    <Screen padded={false} className="pb-4">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.9rem)] backdrop-blur">
        <TrakoLogo size="sm" />
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {place ??
            (status === "denied"
              ? "Localização desligada"
              : status === "granted"
                ? "Localizando…"
                : "Sem GPS")}
        </span>
      </header>

      <div className="space-y-4 px-4 py-4">
        <div>
          <p className="text-sm text-muted-foreground">Bora pra trilha,</p>
          <h1 className="font-display text-2xl font-bold">{name}</h1>
        </div>

        <div className="surface-card relative overflow-hidden px-4 py-5">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Distância total
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="metric-value text-5xl text-primary">{dist.value}</span>
            <span className="text-sm text-muted-foreground">{dist.unit}</span>
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <MiniStat label="Trilhas" value={formatNumber(stats.activities)} />
            <MiniStat label="Horas" value={formatHours(stats.durationS)} />
            <MiniStat label="Nível" value={String(stats.level)} />
          </div>
        </div>

        <Button asChild variant="action" size="hero" className="w-full">
          <Link to="/record">
            <CircleDot className="h-5 w-5" /> Gravar trilha
          </Link>
        </Button>

        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Elevação" value={formatNumber(stats.elevationM)} unit="m" />
          <StatTile
            label="Vel. máx"
            value={stats.maxSpeedKmh.toFixed(0)}
            unit="km/h"
          />
          <StatTile label="Atividades" value={formatNumber(stats.activities)} />
        </div>

        <SectionTitle
          action={
            <Link to="/activities" className="text-xs font-semibold text-primary">
              Ver todas
            </Link>
          }
        >
          Últimas trilhas
        </SectionTitle>

        {activities.isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-surface-2" />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Mountain className="h-8 w-8" />}
            title="Nenhuma trilha ainda"
            description="Tudo começa em zero. Grave sua primeira trilha e veja seus números crescerem."
            action={
              <Button asChild variant="action" size="tap">
                <Link to="/record">Começar agora</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {list.slice(0, 5).map((a) => (
              <ActivityRow key={a.id} activity={a} />
            ))}
          </ul>
        )}
      </div>
    </Screen>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 py-2">
      <p className="metric-value text-lg">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

export function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <li>
      <Link
        to="/activities/$id"
        params={{ id: activity.id }}
        className="surface-card flex items-center gap-3 px-3 py-3 active:scale-[0.99]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Mountain className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold">{activity.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {activity.place_label ? `${activity.place_label} · ` : ""}
            {formatRelative(activity.started_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="metric-value text-base text-primary">{formatKm(activity.distance_m)} km</p>
          <p className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-0.5">
              <Timer className="h-3 w-3" />
              {Math.round(activity.duration_s / 60)}min
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Gauge className="h-3 w-3" />
              {activity.avg_speed_kmh.toFixed(0)}
            </span>
          </p>
        </div>
      </Link>
    </li>
  );
}
