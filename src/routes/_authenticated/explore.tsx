import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Compass, Crosshair, Layers } from "lucide-react";
import { MapSurface } from "@/components/map/MapSurface";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { listPublicActivities } from "@/services/activities";
import { DISCIPLINES, type Discipline } from "@/types/trako";
import { formatKm } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({
    meta: [
      { title: "Explorar trilhas — TRAKO" },
      {
        name: "description",
        content: "Descubra trilhas públicas da comunidade a partir da sua localização real.",
      },
      { property: "og:title", content: "Explorar trilhas — TRAKO" },
      { property: "og:description", content: "Trilhas públicas perto de você, no mapa." },
    ],
  }),
  component: Explore,
});

function Explore() {
  const navigate = useNavigate();
  const { fix, status, retry } = useGeolocation({ auto: true });
  const [filter, setFilter] = useState<Discipline | "all">("all");
  const [recenter, setRecenter] = useState(0);

  const rides = useQuery({ queryKey: ["public-activities"], queryFn: () => listPublicActivities(80) });

  const filtered = useMemo(
    () => (rides.data ?? []).filter((a) => (filter === "all" ? true : a.sport === filter)),
    [rides.data, filter],
  );

  const tracks = useMemo(
    () => filtered.filter((a) => a.track.length > 1).map((a) => ({ id: a.id, points: a.track })),
    [filtered],
  );

  const markers = useMemo(
    () =>
      filtered
        .filter((a) => a.start_lat != null && a.start_lng != null)
        .map((a) => ({
          id: a.id,
          lat: a.start_lat as number,
          lng: a.start_lng as number,
          label: a.title,
          onClick: () => navigate({ to: "/activities/$id", params: { id: a.id } }),
        })),
    [filtered, navigate],
  );

  return (
    <div className="relative h-full">
      <MapSurface
        key={recenter}
        className="absolute inset-0"
        center={fix ? { lat: fix.lat, lng: fix.lng } : null}
        zoom={12}
        tracks={tracks}
        markers={markers}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 space-y-2 bg-gradient-to-b from-background/95 to-transparent px-3 pb-6 pt-[calc(env(safe-area-inset-top,0px)+0.9rem)]">
        <div className="pointer-events-auto flex items-center gap-2">
          <h1 className="font-display text-lg font-bold">Explorar</h1>
          <span className="text-xs text-muted-foreground">
            {rides.isLoading ? "carregando…" : `${filtered.length} trilhas públicas`}
          </span>
        </div>
        <div className="app-scroll pointer-events-auto flex gap-2 overflow-x-auto pb-1">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            Todas
          </Chip>
          {DISCIPLINES.map((d) => (
            <Chip key={d.id} active={filter === d.id} onClick={() => setFilter(d.id)}>
              {d.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-3 flex flex-col gap-2">
        <button
          type="button"
          aria-label="Centralizar na minha posição"
          onClick={() => (status === "denied" ? retry() : setRecenter((n) => n + 1))}
          className="surface-card flex h-12 w-12 items-center justify-center text-primary active:scale-95"
        >
          <Crosshair className="h-5 w-5" />
        </button>
      </div>

      {!rides.isLoading && filtered.length === 0 && (
        <div className="pointer-events-none absolute inset-x-6 bottom-20">
          <div className="surface-card pointer-events-auto flex items-center gap-3 px-4 py-3">
            <Layers className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              Ainda não há trilhas públicas por aqui. Grave a sua e publique para a comunidade.
            </p>
          </div>
        </div>
      )}

      {status === "denied" && (
        <div className="absolute inset-x-6 top-1/2 -translate-y-1/2">
          <div className="surface-card flex flex-col items-center gap-3 px-5 py-6 text-center">
            <Compass className="h-7 w-7 text-primary" />
            <p className="text-sm text-muted-foreground">
              Ative a localização para ver o mapa a partir de onde você está.
            </p>
            <Button variant="action" size="tap" onClick={retry}>
              Ativar GPS
            </Button>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="app-scroll absolute inset-x-0 bottom-3 flex gap-3 overflow-x-auto px-3">
          {filtered.slice(0, 12).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate({ to: "/activities/$id", params: { id: a.id } })}
              className="surface-card w-44 shrink-0 px-3 py-2 text-left active:scale-[0.98]"
            >
              <p className="truncate font-display text-sm font-bold">{a.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {a.place_label ?? "Local não informado"}
              </p>
              <p className="metric-value mt-1 text-sm text-primary">{formatKm(a.distance_m)} km</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface-2 text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
